# Cloudflare deployment

- Project: `time-service`
- Public URL: https://time-service.pages.dev/
- Custom domain: **www.timeservices.co** (corrected by the owner; do not use timeseervices.co).
- Registrar / current DNS setup: GoDaddy; custom domain association added to Pages, awaiting registrar DNS changes.
- Required DNS: CNAME `www` → `time-service.pages.dev`. Inspect and preserve existing mail and other records before editing. Apex redirect remains to be configured after ownership/login and DNS inspection.
- Initial production release: `78681f94-3062-400d-b75b-24b844b97d87`, https://78681f94.time-service.pages.dev/.

## Release workflow

1. Run `npm run build:cloudflare`.
2. Run `node --test scripts/cloudflare/video-worker.test.mjs`.
3. Upload the **contents** of `out` (or a ZIP of those contents) to the existing Pages project as a production deployment.
4. Verify HTTP status on all routes, a genuine 404, desktop/mobile video scrubbing, and model loading.

This project uses Direct Upload. Publishing changes in the local workspace does not automatically update the hosted website. Keep the previous deployment for rollback.

## Video delivery

Cloudflare Pages served MP4 Range requests with HTTP 200 during the first live check, leaving the native video at time zero despite scrolling. `ScrollVideoHero` now probes Range support: HTTP 206 keeps native progressive loading; a complete HTTP 200 response becomes a revocable blob URL to allow seeking. Abort and cleanup run on unmount and when motion preferences change.

R2 Standard bucket `time-service-media` has these two uploaded objects:

- `hero-scroll-1080.mp4` (13,837,329 bytes)
- `hero-scroll-540.mp4` (4,865,721 bytes)

Production Pages variable **MEDIA** is bound to that bucket. Owner confirmed both binding and deployment; both were saved successfully on 2026-09-29. Current production deployment: `a23b501a-4d98-4301-8e8c-ee3a6fae6233`, https://a23b501a.time-service.pages.dev/.

`scripts/cloudflare/prepare.mjs` copies the video Worker to `out/_worker.js` and writes `_routes.json`. Only the two video paths invoke the Function; other routes remain static Pages assets. The Worker serves GET/HEAD and byte ranges from R2, rejects writes, and falls back to the bundled assets if the binding or R2 is unavailable. The bucket itself remains private. Binding grants the runtime access to the bucket; the public handler only exposes the two video files.

Video requests use the Pages Functions/Workers quota as well as R2 operations. The current free Functions quota is 100,000 requests/day; R2 usage is metered beyond its included Standard allowances. No paid Workers plan was enabled. The fail-open runtime setting and bundled videos provide a static fallback.

## Checks completed on 2026-09-29

- Next production build passed, generating 22 routes including internal error routes.
- All 20 public page paths returned HTTP 200 on the initial live release; a nonexistent URL returned HTTP 404.
- No missing local href/src targets in exported HTML.
- Initial 961-file upload succeeded. Revised 963-file upload includes `_worker.js` and `_routes.json`.
- Local revised video on a non-Range server became seekable from 0–15 seconds and advanced with scroll.
- Mobile local check: no horizontal overflow, correct 540 video, CTA heading remains two single-line phrases.
- Live JIULI, MARUN and INOL models loaded; JIULI Front viewpoint worked.
- Worker tests: 14 passing (ranges, suffixes, invalid bounds, HEAD, ETag, If-Range, static fallback and forbidden writes).
- Approved About camera hashes unchanged.

Release bundles and initial HTTP check results are in `output/cloudflare-release-2026-09-29*`.

- Revised live mobile video uses its original R2-backed URL and advances from 0 to 4.19 to 7.78 seconds as scrolling progresses (637 CSS-pixel viewport). Range probe returns HTTP 206 and `X-Video-Source: r2`.
- GoDaddy login verified; `www` currently aliases `timeservices.co.` with one-hour TTL. Edit to `time-service.pages.dev` is prepared, awaiting DNS save confirmation. Existing apex WebsiteBuilder and mail records remain untouched.

- GoDaddy confirmed DNS update successful: CNAME `www` → `time-service.pages.dev`, TTL 1 hour. Cloudflare Check DNS records initiated. Custom domain remains under verification; HTTPS handshake not yet successful at latest check. Apex still points to GoDaddy WebsiteBuilder; mail records preserved.

## Search metadata update

- www.timeservices.co returned HTTPS 200 on 2026-09-29 after DNS verification.
- Homepage title and description now use owner-provided Thai service wording. Canonical points to https://www.timeservices.co/. Open Graph and Twitter share text match.
- Added robots.txt and sitemap.xml containing all 20 public pages. Production build passed. SEO bundle prepared in output/cloudflare-release-2026-09-29-seo; publication pending final confirmation.

- SEO release published: `b2257b49-0550-4a53-9963-71b708404af7`. Verified on live www.timeservices.co: exact owner-provided title and description, robots.txt, sitemap with 20 URLs, HTTPS, and R2 HTTP 206 video response. Google indexing is not yet verified or submitted to Search Console.

- Search Console domain property `sc-domain:timeservices.co` verified successfully via GoDaddy TXT on 2026-09-29 for owner account usaman.teen@gmail.com. Keep the verification TXT record. Sitemap submission and apex 301 are prepared and await action-time confirmations.

- Google live URL test passed: URL available to Google, page can be indexed, video detected. Homepage Request indexing accepted into priority crawl queue on 2026-09-29. Sitemap Submit and apex redirect Save still awaiting owner confirmation.

## Final registrar and Google status

- Search Console sitemap detail confirms processed successfully and 20 discovered pages.
- Owner completed forwarding OTP; GoDaddy confirms forwarding setup complete from timeservices.co to https://www.timeservices.co/.
- Immediate public check: HTTP apex redirects 308 to HTTPS apex; HTTPS apex still returns 200 from previous service, so final redirect propagation is not yet verified. www returns HTTPS 200. GoDaddy advises most DNS updates within one hour, up to 48 hours globally.

## Monitoring complete — 2026-09-30 01:14 Asia/Bangkok

Both HTTP and HTTPS apex now return permanent 301 redirects to https://www.timeservices.co/; destination returns 200 with valid TLS. Sitemap returns 200 and valid XML with 20 URLs. Search Console reports sitemap Success / 20 discovered pages and homepage URL is on Google / Page is indexed. All monitoring completion criteria satisfied; stop scheduled monitoring. This does not assert all 20 pages are indexed or any search ranking.
