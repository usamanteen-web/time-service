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

// ---- Visitor analytics, click tracking and chatbot leads (D1 binding: DB) ----

const DEFAULT_HOSTS = ['timeservices.co', 'www.timeservices.co', 'time-service.pages.dev'];
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl\/|wget|python-requests|httpclient|axios|node-fetch|facebookexternalhit|embedly/i;
const EVENT_TYPES = new Set(['pageview', 'click', 'chat']);
const BANGKOK_SECONDS = 7 * 3600;
const DAY_MS = 86400000;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'},
});
const empty = (status = 204, headers = {}) => new Response(null, {status, headers: {'Cache-Control': 'no-store', ...headers}});
const notAllowed = (allow) => empty(405, {Allow: allow});
const clean = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');
const cleanLines = (value, max) => (typeof value === 'string' ? value.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');

export const bangkokDay = (ms) => new Date(ms + BANGKOK_SECONDS * 1000).toISOString().slice(0, 10);
const dayMs = (day) => Date.parse(`${day}T00:00:00Z`);
const shiftDay = (day, n) => new Date(dayMs(day) + n * DAY_MS).toISOString().slice(0, 10);
const spanDays = (from, to) => Math.round((dayMs(to) - dayMs(from)) / DAY_MS) + 1;
const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(dayMs(value));

const hostOf = (value) => {
  try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
};

function allowedOrigin(request, env) {
  const allowed = env.ALLOWED_HOSTS ? String(env.ALLOWED_HOSTS).split(',').map((host) => host.trim().toLowerCase()) : DEFAULT_HOSTS;
  const host = hostOf(request.headers.get('Origin') || '') || hostOf(request.headers.get('Referer') || '');
  return allowed.includes(host);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Anonymous visitor id: changes every day and never stores the IP address.
async function visitorId(request, env, day) {
  const salt = env.HASH_SALT || env.DASHBOARD_KEY || 'time-service';
  const raw = `${day}|${request.headers.get('CF-Connecting-IP') || ''}|${request.headers.get('User-Agent') || ''}|${salt}`;
  return (await sha256Hex(raw)).slice(0, 24);
}

async function sameSecret(given, expected) {
  const [a, b] = await Promise.all([sha256Hex(given), sha256Hex(expected)]);
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export function deviceOf(userAgent) {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/iphone|mobi/i.test(userAgent)) return 'mobile';
  if (/android/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

async function readJson(request, limit) {
  const raw = await request.text();
  if (raw.length > limit) return {tooLarge: true};
  try { return {value: JSON.parse(raw)}; } catch { return {invalid: true}; }
}

async function collect(request, env, ctx) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.DB || !allowedOrigin(request, env)) return empty();
  const userAgent = request.headers.get('User-Agent') || '';
  if (!userAgent || BOTS.test(userAgent)) return empty();
  const body = await readJson(request, 2048);
  if (body.tooLarge) return empty(413);
  if (body.invalid || typeof body.value !== 'object' || body.value === null) return empty(400);
  const event = body.value;
  const path = clean(event.p, 200);
  if (!EVENT_TYPES.has(event.t) || !path.startsWith('/')) return empty(400);
  const now = Date.now();
  const day = bangkokDay(now);
  const isPageview = event.t === 'pageview';
  const write = env.DB.prepare(
    'INSERT INTO events (ts, day, type, path, category, item, zone, label, ref, camp, entry, device, country, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(
    Math.floor(now / 1000), day, event.t, path,
    clean(event.c, 60), clean(event.i, 100), clean(event.z, 20),
    event.t === 'chat' ? clean(event.l, 200) : '',
    isPageview ? clean(event.r, 100).toLowerCase() : '',
    isPageview ? clean(event.cp, 80) : '',
    isPageview && event.e === 1 ? 1 : 0,
    deviceOf(userAgent), request.cf?.country || '', await visitorId(request, env, day),
  ).run();
  const guarded = write.catch((error) => console.error('collect failed', error));
  if (ctx?.waitUntil) ctx.waitUntil(guarded); else await guarded;
  return empty();
}

function leadNotice({name, contact, message, path}) {
  const content = `New website lead / ลูกค้าฝากข้อมูลจากแชทบอท\nName: ${name}\nContact: ${contact}\nMessage: ${message || '-'}\nPage: ${path || '-'}`.slice(0, 1900);
  return JSON.stringify({content, text: content, allowed_mentions: {parse: []}});
}

// LINE Official Account push (Messaging API). LINE Notify was shut down in 2025, so a lead alert to
// LINE needs an OA channel access token (LINE_CHANNEL_TOKEN) and the owner's user id (LINE_TO).
export function linePush(env, text) {
  if (!env.LINE_CHANNEL_TOKEN || !env.LINE_TO) return null;
  return fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${env.LINE_CHANNEL_TOKEN}`},
    body: JSON.stringify({to: env.LINE_TO, messages: [{type: 'text', text: text.slice(0, 4900)}]}),
  }).catch(() => {});
}

function leadText({name, contact, message, path}) {
  return `ลูกค้าฝากข้อมูลจากเว็บ timeservices.co\nชื่อ: ${name}\nติดต่อ: ${contact}\nรายละเอียด: ${message || '-'}\nหน้าเว็บ: ${path || '-'}`;
}

// ---- E-mail link tracking: https://www.timeservices.co/r/<id> ----
// Each intro e-mail carries its own opaque id. The click is stored, then the visitor is sent on to the
// home page with utm tags, so the page view that follows (JavaScript runs = a real browser, not a
// mail security scanner) is tied to the same id through the campaign field.
const MAIL_ID = /^[a-z0-9]{6,32}$/;
const SCANNERS = /safelinks|mimecast|proofpoint|barracuda|messagelabs|forcepoint|trendmicro|ironport|symantec|fireeye|cisco|zscaler|google-safety|googleimageproxy|yahoo.*slurp/i;

async function mailRedirect(request, env, ctx) {
  const url = new URL(request.url);
  const id = url.pathname.slice(3).replace(/\/+$/, '').toLowerCase();
  const target = new URL('/', url.origin);
  if (MAIL_ID.test(id)) {
    target.searchParams.set('utm_source', 'email');
    target.searchParams.set('utm_medium', 'email');
    target.searchParams.set('utm_campaign', `mail-${id}`);
    const ua = request.headers.get('User-Agent') || '';
    if (env.DB && request.method === 'GET') {
      const now = Date.now();
      const day = bangkokDay(now);
      const kind = !ua || BOTS.test(ua) || SCANNERS.test(ua) ? 'scanner' : 'browser';
      const write = env.DB.prepare(
        'INSERT INTO events (ts, day, type, path, category, item, zone, label, ref, camp, entry, device, country, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(Math.floor(now / 1000), day, 'mail', '/r', 'email', id, kind, '', 'email', `mail-${id}`, 0,
        deviceOf(ua), request.cf?.country || '', await visitorId(request, env, day)).run()
        .catch((error) => console.error('mail click failed', error));
      if (ctx?.waitUntil) ctx.waitUntil(write); else await write;
    }
  }
  return new Response(null, {status: 302, headers: {Location: target.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'}});
}

async function mailStats(request, env) {
  if (request.method !== 'GET') return notAllowed('GET');
  if (!env.DASHBOARD_KEY) return json({error: 'not_configured'}, 503);
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await sameSecret(given, env.DASHBOARD_KEY))) return json({error: 'unauthorized'}, 401);
  if (!env.DB) return json({error: 'no_database'}, 503);
  const params = new URL(request.url).searchParams;
  const to = isDay(params.get('to')) ? params.get('to') : bangkokDay(Date.now());
  let from = isDay(params.get('from')) ? params.get('from') : shiftDay(to, -29);
  if (from > to) from = to;
  const fromTs = Math.floor(dayMs(from) / 1000) - BANGKOK_SECONDS;
  const toTs = fromTs + spanDays(from, to) * 86400;
  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args);
  const people = `
    SELECT l.id, l.company, l.email, l.template, l.sent_ts,
      MIN(CASE WHEN e.type = 'mail' THEN e.ts END) AS first_click,
      SUM(e.type = 'mail' AND e.zone = 'browser') AS clicks,
      SUM(e.type = 'mail' AND e.zone = 'scanner') AS scanner_hits,
      SUM(e.type = 'pageview') AS pageviews,
      MAX(e.ts) AS last_seen
    FROM mail_links l JOIN events e ON e.camp = 'mail-' || l.id
    WHERE e.day BETWEEN ? AND ? AND (e.type = 'pageview' OR e.type = 'mail')
    GROUP BY l.id ORDER BY last_seen DESC LIMIT 500`;
  const [sent, rows, byTemplate] = await env.DB.batch([
    q('SELECT COUNT(*) AS n FROM mail_links WHERE mode = ? AND sent_ts BETWEEN ? AND ?', 'PRODUCTION', fromTs, toTs),
    q(people, from, to),
    q('SELECT template, COUNT(*) AS n FROM mail_links WHERE mode = ? AND sent_ts BETWEEN ? AND ? GROUP BY template', 'PRODUCTION', fromTs, toTs),
  ]);
  const list = (rows.results || []).map((row) => ({...row, opened_site: (row.pageviews || 0) > 0, clicks: row.clicks || 0, scanner_hits: row.scanner_hits || 0, pageviews: row.pageviews || 0}));
  return json({
    range: {from, to},
    sent: sent.results?.[0]?.n || 0,
    sentByTemplate: byTemplate.results || [],
    clickedCompanies: list.filter((row) => row.clicks > 0 || row.opened_site).length,
    openedSite: list.filter((row) => row.opened_site).length,
    scannerOnly: list.filter((row) => row.clicks === 0 && !row.opened_site).length,
    people: list,
  });
}

async function lead(request, env, ctx) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.DB) return json({ok: false, error: 'unavailable'}, 503);
  if (!allowedOrigin(request, env)) return json({ok: false, error: 'forbidden'}, 403);
  const body = await readJson(request, 4096);
  if (body.tooLarge) return json({ok: false, error: 'too_large'}, 413);
  if (body.invalid || typeof body.value !== 'object' || body.value === null) return json({ok: false, error: 'bad_request'}, 400);
  const data = body.value;
  if (clean(data.hp, 50) || BOTS.test(request.headers.get('User-Agent') || '')) return json({ok: true});
  const entry = {name: clean(data.name, 80), contact: clean(data.contact, 120), message: cleanLines(data.message, 1000), path: clean(data.p, 200)};
  if (!entry.name || !entry.contact) return json({ok: false, error: 'missing_fields'}, 422);
  const now = Date.now();
  const day = bangkokDay(now);
  const visitor = await visitorId(request, env, day);
  const used = await env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE visitor = ? AND day = ?').bind(visitor, day).first();
  if ((used?.n ?? 0) >= 5) return json({ok: false, error: 'rate_limited'}, 429);
  await env.DB.prepare('INSERT INTO leads (ts, day, name, contact, message, path, visitor) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(Math.floor(now / 1000), day, entry.name, entry.contact, entry.message, entry.path, visitor).run();
  if (env.LEAD_WEBHOOK_URL) {
    const notify = fetch(env.LEAD_WEBHOOK_URL, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: leadNotice(entry)}).catch(() => {});
    if (ctx?.waitUntil) ctx.waitUntil(notify);
  }
  const line = linePush(env, leadText(entry));
  if (line && ctx?.waitUntil) ctx.waitUntil(line);
  return json({ok: true});
}

// The mailer registers each sent e-mail's link id here (best effort, never blocks a send).
async function mailLinks(request, env) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.MAIL_LINK_KEY || !env.DB) return json({error: 'not_configured'}, 503);
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await sameSecret(given, env.MAIL_LINK_KEY))) return json({error: 'unauthorized'}, 401);
  const body = await readJson(request, 512 * 1024);
  if (body.tooLarge) return json({error: 'too_large'}, 413);
  const items = Array.isArray(body.value?.links) ? body.value.links : null;
  if (!items || items.length > 1000) return json({error: 'bad_request'}, 400);
  const rows = items.filter((item) => MAIL_ID.test(String(item?.id || '')));
  const statements = rows.map((item) => env.DB.prepare(
    'INSERT OR REPLACE INTO mail_links (id, company, email, template, campaign, mode, sent_ts) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(item.id, clean(item.company, 200), clean(item.email, 200).toLowerCase(), clean(item.template, 40),
    clean(item.campaign, 60), clean(item.mode, 20) || 'PRODUCTION', Number.isSafeInteger(item.sent_ts) ? item.sent_ts : Math.floor(Date.now() / 1000)));
  for (let index = 0; index < statements.length; index += 50) await env.DB.batch(statements.slice(index, index + 50));
  return json({ok: true, stored: rows.length, skipped: items.length - rows.length});
}

async function stats(request, env) {
  if (request.method !== 'GET') return notAllowed('GET');
  if (!env.DASHBOARD_KEY) return json({error: 'not_configured'}, 503);
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await sameSecret(given, env.DASHBOARD_KEY))) return json({error: 'unauthorized'}, 401);
  if (!env.DB) return json({error: 'no_database'}, 503);

  const params = new URL(request.url).searchParams;
  const today = bangkokDay(Date.now());
  const to = isDay(params.get('to')) ? params.get('to') : today;
  let from = isDay(params.get('from')) ? params.get('from') : shiftDay(to, -6);
  if (from > to) from = to;
  if (spanDays(from, to) > 366) from = shiftDay(to, -365);
  const length = spanDays(from, to);
  const prevTo = shiftDay(from, -1);
  const prevFrom = shiftDay(prevTo, -(length - 1));

  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args);
  const totalsSql = "SELECT COALESCE(SUM(type = 'pageview'), 0) AS pageviews, COALESCE(SUM(type = 'pageview' AND entry = 1), 0) AS visits, COALESCE(SUM(type = 'click'), 0) AS clicks, COALESCE(SUM(type = 'chat' AND item = 'open'), 0) AS chatOpens FROM events WHERE day BETWEEN ? AND ?";
  const visitorsSql = "SELECT COALESCE(SUM(c), 0) AS visitors FROM (SELECT COUNT(DISTINCT visitor) AS c FROM events WHERE type = 'pageview' AND day BETWEEN ? AND ? GROUP BY day)";
  const leadsSql = 'SELECT COUNT(*) AS n FROM leads WHERE day BETWEEN ? AND ?';
  const visitsBy = (column, fallback) => q(`SELECT COALESCE(NULLIF(${column}, ''), '${fallback}') AS name, COUNT(*) AS n FROM events WHERE type = 'pageview' AND entry = 1 AND day BETWEEN ? AND ? GROUP BY name ORDER BY n DESC LIMIT 15`, from, to);

  const results = await env.DB.batch([
    q(totalsSql, from, to), q(visitorsSql, from, to), q(leadsSql, from, to),
    q(totalsSql, prevFrom, prevTo), q(visitorsSql, prevFrom, prevTo), q(leadsSql, prevFrom, prevTo),
    q("SELECT day, COUNT(*) AS pageviews, COALESCE(SUM(entry), 0) AS visits, COUNT(DISTINCT visitor) AS visitors FROM events WHERE type = 'pageview' AND day BETWEEN ? AND ? GROUP BY day", from, to),
    q("SELECT category, item, COUNT(*) AS n, COUNT(DISTINCT visitor) AS people FROM events WHERE type = 'click' AND day BETWEEN ? AND ? GROUP BY category, item ORDER BY n DESC LIMIT 300", from, to),
    q("SELECT path, COUNT(*) AS pageviews, COUNT(DISTINCT visitor) AS visitors FROM events WHERE type = 'pageview' AND day BETWEEN ? AND ? GROUP BY path ORDER BY pageviews DESC LIMIT 20", from, to),
    visitsBy('ref', 'direct'), visitsBy('device', 'unknown'), visitsBy('country', 'unknown'),
    q("SELECT CAST(strftime('%H', ts + ?, 'unixepoch') AS INTEGER) AS hour, COUNT(*) AS n FROM events WHERE type = 'pageview' AND day BETWEEN ? AND ? GROUP BY hour", BANGKOK_SECONDS, from, to),
    q("SELECT item AS name, COUNT(*) AS n FROM events WHERE type = 'chat' AND day BETWEEN ? AND ? GROUP BY item ORDER BY n DESC LIMIT 50", from, to),
    q("SELECT ts, label FROM events WHERE type = 'chat' AND item = 'unmatched' AND label != '' AND day BETWEEN ? AND ? ORDER BY ts DESC LIMIT 50", from, to),
    q('SELECT id, ts, name, contact, message, path FROM leads WHERE day BETWEEN ? AND ? ORDER BY ts DESC LIMIT 200', from, to),
  ]);
  const rows = (index) => results[index].results || [];
  const first = (index) => rows(index)[0] || {};

  const totalsFrom = (totalsIndex, visitorsIndex, leadsIndex) => ({
    visits: first(totalsIndex).visits || 0,
    visitors: first(visitorsIndex).visitors || 0,
    pageviews: first(totalsIndex).pageviews || 0,
    clicks: first(totalsIndex).clicks || 0,
    chatOpens: first(totalsIndex).chatOpens || 0,
    leads: first(leadsIndex).n || 0,
  });

  const byDay = new Map(rows(6).map((row) => [row.day, row]));
  const daily = [];
  for (let index = 0; index < length; index += 1) {
    const day = shiftDay(from, index);
    const row = byDay.get(day);
    daily.push({day, pageviews: row?.pageviews || 0, visits: row?.visits || 0, visitors: row?.visitors || 0});
  }
  const hours = Array.from({length: 24}, () => 0);
  for (const row of rows(12)) hours[row.hour] = row.n;

  return json({
    range: {from, to, days: length, prevFrom, prevTo},
    totals: totalsFrom(0, 1, 2),
    previous: totalsFrom(3, 4, 5),
    daily,
    clicks: rows(7),
    pages: rows(8),
    sources: rows(9),
    devices: rows(10),
    countries: rows(11),
    hours,
    chat: rows(13),
    unmatched: rows(14),
    leads: rows(15),
  });
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/api/collect') return collect(request, env, ctx);
    if (path === '/api/lead') return lead(request, env, ctx);
    if (path === '/api/stats') return stats(request, env);
    if (path === '/api/mail-stats') return mailStats(request, env);
    if (path === '/api/mail-links') return mailLinks(request, env);
    if (path.startsWith('/r/')) return mailRedirect(request, env, ctx);
    if (path.startsWith('/api/')) return json({error: 'not_found'}, 404);
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
