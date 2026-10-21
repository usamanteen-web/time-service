# Cloud Build Check — `web2-redesign`

- **Date:** 2026-10-21
- **Commit checked:** `ee56ae8` (Redesign web2: 3D About/Contact pages, site-wide motion, canvas copy)
- **Environment:** Node v22.22.0, npm 10.9.4, clean `npm ci` from `package-lock.json`
- **Resolved versions:** next 16.3.6, react / react-dom 19.3.0, @types/react 19.3.0, typescript 7.0.2

## Result: ✅ No TypeScript or build errors

| Command | Exit code | Result |
| --- | --- | --- |
| `npm run build` (`next build --webpack`) | 0 | Compiled successfully in 17.1s; TypeScript check passed; 17/17 static pages generated |
| `npm run typecheck` (`tsc --noEmit`) | 0 | No diagnostics |

The build log contains no warnings or errors (only the standard Next.js telemetry notice). Nothing was modified to get these results.

## Routes produced

```
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ○ /contact
├ ○ /news
├   /news/[slug]
│ ├ ● /news/a-better-exhibition-brief
│ ├ ● /news/materials-and-atmosphere
│ └ ● /news/from-design-to-installation
├ ○ /projects
├   /projects/[slug]
│ ├ ● /projects/the-open-pavilion
│ ├ ● /projects/blue-horizon
│ ├ ● /projects/living-canopy
│ └ ● [+3 more paths]
└ ○ /services

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

## Notes

- Several dependencies are pinned to `latest` in `package.json` (next, react, react-dom, framer-motion, lucide-react, typescript, tailwind, @types/*). The lockfile keeps `npm ci` reproducible, but a fresh `npm install` without the lockfile could pull newer majors and change this result.
- Only one `AGENTS.md` exists in the repo (at the root, which is also the app folder); it points to the bundled Next.js docs in `node_modules/next/dist/docs/`.
