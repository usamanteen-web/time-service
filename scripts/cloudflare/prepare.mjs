import {copyFile, writeFile} from 'node:fs/promises';
await copyFile(new URL('./video-worker.mjs', import.meta.url), new URL('../../out/_worker.js', import.meta.url));
await writeFile(new URL('../../out/_routes.json', import.meta.url), JSON.stringify({version: 1, include: ['/videos/jiuli/hero-scroll-1080.mp4', '/videos/jiuli/hero-scroll-540.mp4'], exclude: []}, null, 2));
console.log('Cloudflare video worker prepared; bind MEDIA to time-service-media before deploying.');
