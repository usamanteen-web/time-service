# Time Service Designs and Constructions

A complete bilingual company website built with Next.js 16.3.6, React 19.3.0, TypeScript, Tailwind CSS, Framer Motion and Lucide.

## Run locally

```sh
npm ci
npm run dev
```

The local preview opens at http://127.0.0.1:3016. `npm run build` exports the website into `out/`. `npm run typecheck` validates TypeScript. Deployment uses the existing identity in `.openai/hosting.json`; do not create a second Site.

Production builds use Next.js's Webpack compiler because Turbopack's CSS subprocess cannot bind a local port in this managed workspace. The development preview continues to use Turbopack.

## Pages

- Home, About, Services, Projects, News & Insights, Contact.
- Six individual concept pages and three editorial articles.
- Project category filters, responsive mobile dialog navigation, contact telephone/WhatsApp/Maps links.
- User-supplied company logo in the header, mobile menu, footer, browser icon and Apple touch icon.

## Images and provenance

Eight original architectural concept images were generated with the built-in GPT Image tool and saved in `public/images/`: pavilion, event, construction, lighting, interior, team, pavilion-blue and pavilion-green. They illustrate design possibilities and are explicitly identified as AI concepts where they could be mistaken for completed work. No suggested client brand names are presented as actual clients.

Original generated PNGs and exact generation prompts are preserved in `../output/time-service-images/`. See `prompt-manifest.json` and `asset-manifest.json` there. The logo was supplied by the user as `apple-touch-icon.png` and copied without alteration.

Company contact details and the four statistics follow the supplied company brief/reference. The journal is original general guidance, not an assertion of recent company news. Contact actions open the visitor’s phone, WhatsApp or Maps; there is no form that claims to send an enquiry.

## Scroll video

The supplied MP4 is preserved at `public/videos/hero-scroll.mp4`. The live hero uses the optimized desktop (1280×720, 8.866 MiB) or mobile (960×540, 5.308 MiB) derivative. Both have H.264 video, no audio, 24 fps, 241 frames, a six-frame GOP, and faststart metadata. Encoding details are in `../output/time-service-video/README.md`.

The video has no autoplay, loop, controls or calls to `play()`. A Framer Motion scroll value sets a target time; a bounded requestAnimationFrame loop seeks toward that time and stops. It works in both directions and returns to frame zero at the top. Text chapters use the same measured scroll position. Poster fallback is frame zero from the supplied video. Reduced-motion users receive a static poster and a normal-height hero; video loading failure also removes the long scroll region.

Google Fonts are downloaded locally in `public/fonts/` (Cormorant Garamond, Manrope, Noto Sans Thai). Images use `next/image` with local files, lazy loading and reserved dimensions. Image optimization is done before deployment because the project is a portable static export without an image server.

## Motion and interactive 3D

- [Basement Scrollytelling](https://github.com/basementstudio/scrollytelling) (`@bsmnt/scrollytelling` 0.3.3 with GSAP) drives the horizontal typography band and the three-chapter spatial experience. Scrolling orbits the camera; dragging or choosing a camera view gives the visitor control. Reset returns to the scroll perspective.
- The full-detail GLB models, HILONG B103 (22.61 MB, 241,536 triangles, 20 embedded images) and JIULI R110 (14.36 MB, 200,213 triangles, 6 embedded images), are copied byte-for-byte from `../output/detailed-web-booths/models/`. The active viewer uses these full models at every screen size; it no longer uses the simplified, untextured models. Only the selected model loads near the section, with a progress indicator and a detailed poster/error fallback. They are reconstructed studies from supplied drawings and photographs, not evidence of a client relationship. Undocumented dimensions remain estimates; screen content is still imagery and some obscured graphics were reconstructed from the reference photos. See the source package README for provenance and limits.
- The homepage project collection uses an asymmetric Bento grid with frosted captions, pointer tilt and a light reflection. Buttons respond subtly to the pointer; focus and touch controls remain available.
- Section headings reveal word by word; hero letters move with the existing paused video timeline. About and contact imagery use bounded parallax. The header, image captions and 3D controls use translucent glass surfaces. The original white theme is restored, with navy feature sections and the detailed 3D explorer retained.
- Live `prefers-reduced-motion` changes disable decorative motion and collapse long scroll scenes. Mobile uses a normal-flow 3D section with manual camera controls. Overview, reception, interior, structure and booth-specific detail presets move the target as well as the camera. Zoom buttons work inline without trapping page scrolling; the expanded native dialog supports pinch/wheel zoom and panning, traps focus, closes with Escape and restores the prior camera view. Pointer effects run only on fine pointers; model rendering is handled on demand by model-viewer. All timers, media listeners and animation frames are cleaned up on unmount.

## Validation

- TypeScript check and complete production static export passed.
- Optimized video streams fully decoded and keyframe intervals verified.
- Browser inspection at desktop and mobile sizes: company logo, images, navigation dialog, concept filters, detail navigation and no horizontal overflow.
- Hero inspected at top, intermediate progress and end: paused throughout, first frame at top, final frame at the end, scroll-derived text visibility.
- Motion and full-detail update inspected at 1440 × 1000, 1440 × 900 and 375 × 812: dark surfaces, Bento layout, both loaded detailed models, reception/interior/meeting viewpoints, expanded viewer, keyboard camera controls, mobile layout, Escape dismissal with focus restoration and 44 px controls. No horizontal overflow at these sizes. Geometry, embedded images and source checksums match the detailed asset package; the full GLBs have existing Khronos validator reports with 0 errors and 0 warnings.
- Reduced-motion behavior is implemented and code reviewed; physical iPhone Safari/Android Chrome device testing has not been performed.

The prior `../site/` project remains untouched.

## Hosting status

The private Site was registered, but publication did not run: the installed Sites plugin files disappeared from the local plugin cache before packaging. No deployment URL has been verified. The local preview and complete `out/` export are the current deliverables. If Sites is restored, reuse the registered project ID in `.openai/hosting.json` and follow its normal source/publish workflow.
