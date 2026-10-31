import {copyFile, writeFile} from 'node:fs/promises';
await copyFile(new URL('./video-worker.mjs', import.meta.url), new URL('../../out/_worker.js', import.meta.url));
await writeFile(new URL('../../out/_routes.json', import.meta.url), JSON.stringify({version: 1, include: ['/videos/jiuli/hero-scroll-1080.mp4', '/videos/jiuli/hero-scroll-540.mp4', '/api/*', '/r/*'], exclude: []}, null, 2));
console.log('Cloudflare worker prepared (video + analytics API); bind MEDIA to time-service-media and DB to the analytics D1 database before deploying.');
