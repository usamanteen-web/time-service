# Design collections — asset notes

Implemented in `time-service-web`, 28 September 2026.

## Art Toy

The interactive asset is exported from `Projects/3D Model Designs/Concept-3D models /Art Toy model/Art toy Cenematic/Orange_Ocean_Atelier_v5_Final.blend`. The Art Toy gallery uses the six explicitly selected concept images (463.jpg and five ChatGPT PNGs), not the older render collection. The supplied 463.jpg is now the Displays Stores category cover, with a CSS crop to hide editor borders; originals are preserved. The 3D Model Designs cover is INOL rear slab gallery (02).

## Generated covers

### Vehicles & Tour

Output: `public/images/covers/vehicles-tour.webp`

Final prompt:

Use case: ads-marketing. Generate a premium corporate website category cover image for Vehicles & Tour, a Thailand exhibition company's transport and tour service. Wide 3:2 cinematic photorealistic image, no text or logos. Elegant unbranded dark navy executive passenger van and a small luxury tour coach arriving in front of a refined contemporary Bangkok convention hotel, tropical palms and warm architectural lighting at blue hour. Credible professionally photographed architecture, restrained navy and cream palette, polished stone forecourt. Clear vehicle subject occupying central area with breathing room, sophisticated hospitality atmosphere. Bottom quarter darker calm for white title overlay. No building construction site, no drawings, no collage, no typography, no watermark.

### Hanging Structure

Output: `public/images/hanging-structure.jpg`

Final prompt:

Use case: stylized-concept. Premium corporate exhibition design website cover, landscape 3:2. Photorealistic architectural concept render inside a dark high-ceiling exhibition hall. Hero focus is an elegant suspended double ribbon circular white fascia with restrained blue accent trim floating high above an open, beautifully furnished white and oak exhibition booth. Carefully visible black aluminum overhead truss grid, discreet suspension wires, focused warm spotlights, rich navy hall ambience. View slightly elevated front three-quarter showing the entire structure and its relationship to the open meeting and display area below. Suspended architecture is the central visual subject and entirely in frame. Luxury precise realistic materials, tasteful blue and cream palette. Lower quarter calm dark gradient natural shadows for title overlay. No logos, no text, no construction cranes, no gimmicks, no UI, no watermarks.

## Asset workflow

- `node scripts/import-media-catalog.mjs` regenerates optimized gallery images and `lib/media-catalog.ts` from the supplied Projects folder.
- `scripts/export/` contains Blender export tooling and per-model export metadata.
- `scripts/export/review/validation.json` records independent GLB decode and geometry/bounds checks.
- Local Draco decoder assets in `public/models/catalog/draco/` support compressed models without a remote decoder dependency.
- Large models load near the viewport; only the selected model canvas is mounted. Category and model galleries use lazy loading and show their complete image sequences in source order.

## Pages

- `/projects/3d-model-designs/`: six models and 31 images, all visible in a continuous sequence. The photographs occupy the full content width, with a compact project jump menu in the introduction and no pinned navigation or canvas. Each project opens its model in a full-screen dialog on demand, with rotation, zoom and preset viewpoints. HILONG is excluded from the public collection.
- `/news/the-open-pavilions/`: Korea Pavilions guided story.
- `/news/double-decker-exhibition-stands/`: MARUN guided story, including the user-supplied Best Design and Construction certificate recognition (no issuer or date asserted).
- `/news/hanging-structure/`: JIULI guided story.
- Existing category and editorial routes remain available; `/projects/blue-horizon/` remains a compatibility route for 3D Model Designs.


## September 28 image and interaction revision

- Profile cover: latest user-supplied `Tiime service designs.png` (MARUN), optimized at `public/images/covers/time-service-designs-marun.webp`; shared by Home, Projects and the Profiles opener.
- Homepage: the supplied JIULI construction film follows scroll in the opening story, plus JIULI / MARUN / INOL in the separate interactive viewer.
- About: a pinned MARUN camera sequence alongside the complete story, including the factory bento described below. Generated team images have illustrative alt text and a discreet note in their lightbox.
- Systems card: Korea promotion reverse (05); detail hero: standard block (03).
- Projects opening image: Orange Ocean concept04; Displays detail opening: Orange Ocean concept03 material board.
- All six category cards cycle three internal collection images on pointer hover or keyboard focus; reduced motion uses a still preview. Preview text, counters and step bars are removed per the latest request.
- Category stories: Systems architectural study; Events three photographic acts; Displays layered retail cards; Vehicles horizontal fleet journey. Each has its own ordered bento layout, scroll image motion and keyboard-accessible lightbox. Profiles retains its 132-image chapter archive.
- News lists only the three spatial stories. Old article URLs remain compatible.
- Mobile layouts, reduced-motion alternatives and local Draco assets are preserved.

## Final image selection and cleaner galleries

- Services share one image mapping on Home and Services: Haisenpet for Exhibition, workshop photo for Project Consulting, and the Vehicles & Tour cover for Transportation & Tours.
- Featured/News covers share Korea standard block detail, the supplied MARUN double-decker render and the supplied JIULI hanging-structure render. Article heroes and related cards use the same selection.
- Systems story: Identity retains standard block detail; Connection shows pavilion overview; Details shows promotion hero.
- Sprinter starts with the Mercedes-logo seating photo (source album image 4); the former worn-seat image is excluded and the replacement appears once.
- Visible image ordinals, corner badges, photo totals, lightbox counters and collection-preview labels have been removed from the general collections. Time Service Profiles alone retains numbered chapters, branded chapter tiles, photo ordinals and functional lightbox counters. The intro statistics, branded-tile photo ranges, opening-collage totals and sticky-rail photo count are removed per the user's correction. Chapter selection uses a black circular active state with hover, press and keyboard-focus feedback.

## Four-factory proof and About scrollytelling

- Exhibition is titled “Exhibition Design & Construction” in shared content. Home and Services retain the service as the main heading, with four in-house production facilities as supporting proof. Services adds the design → production → installation sequence, an 04 proof band and the revised three service details. The latest supplied English sentence is preserved without the dash after “life”.
- The Home Production step mentions in-house fabrication across four factories. A bilingual “4 Factories. One Standard.” band follows the timeline; short desktop viewports use normal flow so this additional copy stays visible.
- About retains its split layout for the complete page content. MARUN remains pinned left; the factory article, photo bento, recognition, process and contact invitation all sit in the white right column. Bilingual body copy uses a readable single column. The opener uses the site's character-rise entrance; subsequent headings use the shared scroll-driven character tilt/reveal, reversible with scroll. Paragraphs and process rows fade and rise into view, the process track draws with scroll, and text links have hover/focus feedback.
- “Our Own Factory” follows the latest supplied reference: a two-line title and concise vision article, then six rounded photo tiles in alternating 62/38, 36/64 and 50/50 rows. Each image fades and rises over 350ms, with a 350ms stagger within each row. Explore more appends two additional photographs; the keyboard-accessible dialog supports arrows, Escape and focus return. `docs/factory-assets.md` records real-photo sources; `docs/factory-image-generation.md` records prompts and outputs for the three newly generated Time Service uniform scenes. These illustrate production stages, not one photograph of each facility.
- MARUN follows an authored 11-view tour: overview, brand identity, reception, meeting suite, two-level reveal, staircase, upper lounge, plan, reverse orbit, side identity and a final wide reveal. Shape-preserving cubic interpolation plus frame-rate-independent damping provides continuous motion without hiding cuts or stopping at every keyframe. Close views use calibrated metre distances and their own object targets. Reduced motion retains a still view.
- The user approved this camera sequence. Its complete source and SHA-256 hashes are saved in `docs/camera/about-camera-approved-2026-09-28.json`; both camera files were verified unchanged after the latest UI revision.
- The latest request includes mobile readiness. On portrait phones, the model stage uses 30svh (200–300px) to leave space for reading, and the opening heading fits in three lines. Short landscape screens use normal flow. Narrow factory grids use equal columns so captions fit. Approved camera poses, targets and interpolation remain unchanged.

## Latest desktop verification

- Production build generated all 22 pages; TypeScript and diff whitespace checks passed.
- At 1440×1000, the factory grid shows six loaded images with no horizontal overflow. Expand/collapse changes six to eight images and back. Photo arrow navigation, Escape and focus return work.
- Profiles chapter rail and branded-tile chapter numbers were checked in the browser, along with the removal of intro totals, photo ranges and the rail photo count. The selected chapter is a 44×44 black circle. The exact supplied Our services sentence was also verified.

## September 29 text motion and mobile verification

- Restored the shared `SplitChars` choreography on About, including Our Own Factory. Scroll-driven heading progress was checked at a partial reveal and at completion; intro body copy is staggered and the story cue now links to the next chapter.
- Reduced-motion styles keep text, vision copy and gallery tiles fully visible, including when the preference changes while the page is open.
- Browser checks at 320×740 and 390×844 cover About reading space, mobile navigation, gallery expansion and photo navigation. Home, Services, Projects, News, Contact, Profiles and 3D Model Designs had no document-level horizontal overflow at 320px.
- At 320×740, the MARUN dialog loads, its camera presets and zoom respond, and controls fit. At 844×390, About's model no longer remains pinned over the reading area. Desktop layout was checked at 1440×1000.
- Phone checks use browser viewport emulation; physical iOS/Android performance and touch gestures are not asserted by these checks.
- Profile chapter cards keep the globe at the card centre and place “Spaces in practice” at the lower right with an 18–30px inset. Chapter cards also participate in the rail's reading-position tracking; a separate chapter attribute preserves photo focus return. The reading band uses viewport-height pixels and updates on resize.
- On mobile, the shared Profile collection card shows TIME SERVICE / PROFILES on two lines in the existing serif font; its arrow sits beside the subtitle. The global header/menu/footer wordmark now colours only the M in TIME red, matching the logo asset. Regular company-description text retains its original colour.
- All three News stories use a compact, non-sticky model viewer below 900px. The text chapters remain fully visible in normal document flow; full-screen exploration remains available. Checked Korea at 390px and MARUN/JIULI at 320px, including the JIULI full-screen dialog.
- The Home featured carousel uses 01 / 02 / 03 with 44px targets, a bright active number and fading underline. Selecting 02 was verified to change the slide and active colour.
- Mobile Home image captions use stronger dark glass for white-text contrast. The mobile Projects opening Orange Ocean image runs to both viewport edges with no corner radius; the collection cards retain their rounded layout.
- The display collection is named “Displays & Pop-Ups” throughout visible content and metadata, including Home, Projects and the existing `/projects/material-dialogue/` route. Importer labels match; original source-directory names and stable URL keys are preserved.

## Home scroll film

- Source: `output/jiuli-video-repair/Jiuli-EBK-timber-fixed-rigging-15s.mp4` in the parent workspace, supplied by the user. The complete 15-second, 360-frame sequence is preserved.
- Local H.264 encodes at `public/videos/jiuli/hero-scroll-1080.mp4` and `hero-scroll-540.mp4` add a keyframe every six frames (0.25 seconds) for seeking. These are silent media assets with no playback controls; the paused video's time follows scroll forward and backward with a short smoothing interval.
- Existing six text chapters and the separate interactive 3D section remain. The Hero itself no longer loads a 3D model. Desktop positions the contained film to the right of the text, with softened frame edges and a lighter shade over the booth. Portrait phones contain the landscape film to keep the full booth visible; the two “We build” sentences are hidden on mobile while the supporting description and actions remain.
- Reduced motion displays `public/images/hero/jiuli-video-complete.jpg` without assigning a video source. The initial frame is used as a loading poster, and decode errors also fall back to the completed booth.
- Mobile captions in the separate Home 3D explorer show a compact model name and selected view label for JIULI, MARUN and INOL. The long description and floor dimensions remain on desktop; mobile retains the full-size camera controls below a smaller caption.
- The mobile explorer canvas, caption and toolbar use normal flow, with 12px gaps between each, so wrapped control hints cannot overlap a caption. Inline and expanded views share this layout.
- The Home supervisor photograph is full bleed on mobile. The Home closing invitation uses smaller headings and 46px/44px actions, with “LET’S BUILD TOGETHER” at a 36px top inset; other-page CTAs and desktop styling are unchanged.
