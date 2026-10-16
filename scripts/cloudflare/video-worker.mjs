const videos = new Set(['/videos/jiuli/hero-scroll-1080.mp4', '/videos/jiuli/hero-scroll-540.mp4']);

export function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const suffix = !match[1];
  const start = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = suffix || !match[2] ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return null;
  return { offset: start, length: end - start + 1 };
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!videos.has(path) || !env.MEDIA) return env.ASSETS.fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {status: 405, headers: {Allow: 'GET, HEAD'}});
    const key = path.split('/').pop();
    try {
      const metadata = await env.MEDIA.head(key);
      if (!metadata) return env.ASSETS.fetch(request);
      const headers = new Headers();
      metadata.writeHttpMetadata(headers);
      headers.set('Content-Type', 'video/mp4');
      headers.set('Accept-Ranges', 'bytes');
      headers.set('ETag', metadata.httpEtag);
      headers.set('Last-Modified', metadata.uploaded.toUTCString());
      headers.set('Cache-Control', 'public, max-age=86400');
      headers.set('X-Video-Source', 'r2');
      if (request.headers.get('If-None-Match') === metadata.httpEtag) return new Response(null, {status: 304, headers});
      if (request.method === 'HEAD') {
        headers.set('Content-Length', String(metadata.size));
        return new Response(null, {headers});
      }
      const rangeHeader = request.headers.get('Range');
      const ifRange = request.headers.get('If-Range');
      const rangeAllowed = !ifRange || ifRange === metadata.httpEtag || ifRange === metadata.uploaded.toUTCString();
      let range;
      if (rangeHeader && rangeAllowed) {
        range = parseRange(rangeHeader, metadata.size);
        if (!range) {
          headers.set('Content-Range', `bytes */${metadata.size}`);
          return new Response(null, {status: 416, headers});
        }
      }
      const object = await env.MEDIA.get(key, range ? {range} : undefined);
      if (!object) return env.ASSETS.fetch(request);
      headers.set('Content-Length', String(range ? range.length : object.size));
      if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
      return new Response(object.body, {status: range ? 206 : 200, headers});
    } catch {
      // The client also supports complete-file seeking if R2 is unavailable.
      return env.ASSETS.fetch(request);
    }
  },
};
