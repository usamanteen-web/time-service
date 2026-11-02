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

export function bangkokDay(ms) { return  new Date(ms + BANGKOK_SECONDS * 1000).toISOString().slice(0, 10); }
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
  // Optional filter: one campaign (e.g. INTRO-2026Q4). Empty = every campaign.
  const campaign = clean(params.get('campaign') || '', 60);
  const fromTs = Math.floor(dayMs(from) / 1000) - BANGKOK_SECONDS;
  const toTs = fromTs + spanDays(from, to) * 86400;
  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args);
  const camp = "(? = '' OR l.campaign = ?)";
  const people = `
    SELECT l.id, l.company, l.email, l.template, l.campaign, l.sent_ts,
      MIN(CASE WHEN e.type = 'mail' THEN e.ts END) AS first_click,
      SUM(e.type = 'mail' AND e.zone = 'browser') AS clicks,
      SUM(e.type = 'mail' AND e.zone = 'scanner') AS scanner_hits,
      SUM(e.type = 'pageview') AS pageviews,
      MAX(e.ts) AS last_seen
    FROM mail_links l JOIN events e ON e.camp = 'mail-' || l.id
    WHERE e.day BETWEEN ? AND ? AND (e.type = 'pageview' OR e.type = 'mail') AND ${camp}
    GROUP BY l.id ORDER BY last_seen DESC LIMIT 500`;
  // Per campaign and e-mail set: mails sent in the range, and how many of those were clicked / opened the site.
  const perCampaign = `
    SELECT l.campaign, l.template, COUNT(*) AS sent,
      SUM(COALESCE(c.clicks, 0) > 0 OR COALESCE(c.pv, 0) > 0) AS clicked,
      SUM(COALESCE(c.pv, 0) > 0) AS opened,
      SUM(COALESCE(c.scans, 0) > 0 AND COALESCE(c.clicks, 0) = 0 AND COALESCE(c.pv, 0) = 0) AS scanner_only
    FROM mail_links l LEFT JOIN (
      SELECT camp, SUM(type = 'mail' AND zone = 'browser') AS clicks, SUM(type = 'mail' AND zone = 'scanner') AS scans,
        SUM(type = 'pageview') AS pv
      FROM events WHERE camp LIKE 'mail-%' GROUP BY camp
    ) c ON c.camp = 'mail-' || l.id
    WHERE l.mode = 'PRODUCTION' AND l.sent_ts BETWEEN ? AND ?
    GROUP BY l.campaign, l.template ORDER BY l.campaign, sent DESC`;
  const [rows, campaigns, all] = await env.DB.batch([
    q(people, from, to, campaign, campaign),
    q(perCampaign, fromTs, toTs),
    q("SELECT DISTINCT campaign FROM mail_links WHERE mode = 'PRODUCTION' ORDER BY campaign"),
  ]);
  const breakdown = (campaigns.results || []).map((row) => ({...row, clicked: row.clicked || 0, opened: row.opened || 0, scanner_only: row.scanner_only || 0}));
  const shown = breakdown.filter((row) => !campaign || row.campaign === campaign);
  const sum = (key) => shown.reduce((total, row) => total + (row[key] || 0), 0);
  const list = (rows.results || []).map((row) => ({...row, opened_site: (row.pageviews || 0) > 0, clicks: row.clicks || 0, scanner_hits: row.scanner_hits || 0, pageviews: row.pageviews || 0}));
  return json({
    range: {from, to},
    campaign,
    campaignList: (all.results || []).map((row) => row.campaign),
    sent: sum('sent'),
    sentByTemplate: shown.map(({template, sent}) => ({template, n: sent})),
    byCampaign: breakdown,
    clickedCompanies: list.filter((row) => row.clicks > 0 || row.opened_site).length,
    openedSite: list.filter((row) => row.opened_site).length,
    scannerOnly: list.filter((row) => row.clicks === 0 && !row.opened_site).length,
    people: list,
  });
}

// ---- Chatbot AI route: languages the rule bot does not speak (Teen 2026-11-01) ----
// POST /api/chat-ai {mode:'detect', text} -> {lang, name, intent}
// POST /api/chat-ai {mode:'translate', to, name, strings:[...]} -> {strings:[...]}
// Runs on Workers AI (binding AI). Answers are still the bot's own site-data replies; the model only
// detects the language/topic and translates. Phone numbers, e-mails and URLs are verified unchanged.
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const AI_INTENTS = ['greeting', 'quote', 'projects', 'services', 'service:exhibition', 'service:event', 'service:lighting',
  'service:interior', 'service:construction', 'contact', 'human', 'location', 'process', 'factory', 'about', 'thanks', 'bye', 'unmatched'];
const AI_DAILY_LIMIT = 80;
const PROTECTED = /(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|\+?\(?\d[\d\s()+-]{6,}\d/g;

function aiText(result) {
  if (typeof result?.response === 'string') return result.response;
  if (result?.response && typeof result.response === 'object') return JSON.stringify(result.response);
  return result?.choices?.[0]?.message?.content || '';
}

function firstJson(text, open, close) {
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

// A translation is accepted only if every phone/e-mail/URL of the source survives verbatim.
export function keepsProtected(source, translated) {
  if (typeof translated !== 'string' || !translated.trim()) return false;
  return (source.match(PROTECTED) || []).every((token) => translated.includes(token.trim()));
}

async function chatAi(request, env, ctx) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.AI) return json({error: 'unavailable'}, 503);
  if (!allowedOrigin(request, env)) return json({error: 'forbidden'}, 403);
  const userAgent = request.headers.get('User-Agent') || '';
  if (!userAgent || BOTS.test(userAgent)) return json({error: 'forbidden'}, 403);
  const body = await readJson(request, 16384);
  if (body.tooLarge) return json({error: 'too_large'}, 413);
  const data = body.value;
  if (body.invalid || typeof data !== 'object' || data === null) return json({error: 'bad_request'}, 400);
  const now = Date.now();
  const day = bangkokDay(now);
  const visitor = await visitorId(request, env, day);
  if (env.DB) {
    const used = await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'ai' AND visitor = ? AND day = ?").bind(visitor, day).first();
    if ((used?.n ?? 0) >= AI_DAILY_LIMIT) return json({error: 'rate_limited'}, 429);
  }
  const log = (item) => {
    if (!env.DB) return;
    const write = env.DB.prepare('INSERT INTO events (ts, day, type, path, category, item, zone, label, ref, camp, entry, device, country, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(Math.floor(now / 1000), day, 'ai', '/api/chat-ai', 'chat', clean(item, 100), 'chat', '', '', '', 0, deviceOf(userAgent), request.cf?.country || '', visitor).run()
      .catch(() => {});
    if (ctx?.waitUntil) ctx.waitUntil(write);
  };
  const run = (system, user, maxTokens) => env.AI.run(AI_MODEL, {messages: [{role: 'system', content: system}, {role: 'user', content: user}], max_tokens: maxTokens, temperature: 0});

  if (data.mode === 'detect') {
    const text = clean(data.text, 300);
    if (!text) return json({error: 'bad_request'}, 400);
    const system = 'You classify one chat message sent to the website chatbot of an exhibition booth, event and transport company in Thailand. '
      + 'Reply with JSON only: {"lang": ISO 639-1 code of the language the message is written in, "name": that language\'s own name for itself, '
      + `"intent": one of ${JSON.stringify(AI_INTENTS)}}. quote = asks price, cost or budget. human = wants to talk to a person or sales. `
      + 'contact = asks for phone, e-mail, LINE, WeChat or WhatsApp. location = asks where the office is. '
      + 'service:exhibition = booth / stand / exhibition / pavilion design or build. service:event = events, launches, stages, conferences. '
      + 'service:lighting = lighting, sound, LED. service:interior = transport, airport transfer, vans, buses, tours, travel. '
      + 'service:construction = project consulting, site coordination. process = steps or timeline. projects = portfolio or past work. '
      + 'Use unmatched only when nothing fits.';
    let parsed = null;
    try { parsed = firstJson(aiText(await run(system, text, 120)), '{', '}'); } catch (error) { console.error('chat-ai detect', error); }
    if (!parsed) return json({error: 'ai_failed'}, 502);
    const lang = /^[a-z]{2,3}$/i.test(String(parsed.lang || '')) ? String(parsed.lang).toLowerCase() : '';
    const intent = AI_INTENTS.includes(parsed.intent) ? parsed.intent : 'unmatched';
    log(`detect:${lang}`);
    return json({lang, name: clean(String(parsed.name || ''), 40), intent});
  }

  if (data.mode === 'translate') {
    const to = String(data.to || '').toLowerCase();
    const strings = Array.isArray(data.strings) ? data.strings.slice(0, 40).map((value) => cleanLines(String(value ?? ''), 1500)) : [];
    if (!/^[a-z]{2,3}$/.test(to) || !strings.length) return json({error: 'bad_request'}, 400);
    const system = `Translate each string in the JSON array from English into ${clean(String(data.name || ''), 40) || to} (language code ${to}). `
      + 'Keep person names, company names, brand names, phone numbers, e-mail addresses, URLs, bullet characters and line breaks exactly as they are. '
      + 'Use a polite, friendly customer-service tone. Reply with a JSON array of exactly the same length and order, and nothing else.';
    let parsed = null;
    try { parsed = firstJson(aiText(await run(system, JSON.stringify(strings), 2000)), '[', ']'); } catch (error) { console.error('chat-ai translate', error); }
    if (!Array.isArray(parsed) || parsed.length !== strings.length) return json({error: 'ai_failed'}, 502);
    const out = strings.map((source, index) => (keepsProtected(source, parsed[index]) ? cleanLines(String(parsed[index]), 1500) : source));
    log(`translate:${to}`);
    return json({strings: out});
  }

  return json({error: 'bad_request'}, 400);
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

// ---- Mail-sending dashboard (/admin/tracking-mail/): snapshots pushed by the Mac mailer, one row per sender account ----
// Accounts Teen named on 2026-11-02. Harry is tracked through mail he cc's to pimchanok.event@gmail.com.
export const MAIL_ACCOUNTS = {
  gmail: {address: 'usaman.teen.event@gmail.com', status: 'sending'},
  domain: {address: 'usaman.teen@timeservices.co', status: 'waiting_domain'},
  harry: {address: 'pimchanok.event@gmail.com', status: 'not_connected'},
};
const ACCOUNT_STATUSES = new Set(['sending', 'waiting_domain', 'not_connected', 'connected', 'error']);

async function bearerMatches(request, secret) {
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(secret) && (await sameSecret(given, secret));
}

// POST /api/mail-snapshot {account, status?, data} (MAIL_LINK_KEY) -> stores the latest snapshot for that account.
async function mailSnapshot(request, env) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.MAIL_LINK_KEY || !env.DB) return json({error: 'not_configured'}, 503);
  if (!(await bearerMatches(request, env.MAIL_LINK_KEY))) return json({error: 'unauthorized'}, 401);
  const body = await readJson(request, 256 * 1024);
  if (body.tooLarge) return json({error: 'too_large'}, 413);
  const value = body.value || {};
  const account = clean(value.account, 20);
  if (!MAIL_ACCOUNTS[account]) return json({error: 'unknown_account'}, 400);
  const status = ACCOUNT_STATUSES.has(value.status) ? value.status : MAIL_ACCOUNTS[account].status;
  const data = value.data && typeof value.data === 'object' ? JSON.stringify(value.data) : null;
  if (data && data.length > 200000) return json({error: 'too_large'}, 413);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO mail_snapshots (account, status, data, updated_at) VALUES (?, ?, ?, ?)',
  ).bind(account, status, data, Math.floor(Date.now() / 1000)).run();
  return json({ok: true, account, status});
}

// ---- Mail archive (Teen 2026-11-03: every mail on the dashboard must be readable) ----
const MSG_ID = /^[A-Za-z0-9_-]{6,64}$/;
const DIRECTIONS = new Set(['sent', 'reply', 'harry', 'customer', 'internal', 'auto', 'bounce']);

// POST /api/mail-archive {messages:[...]} (MAIL_LINK_KEY) -> upsert full mail copies.
async function mailArchive(request, env) {
  if (request.method !== 'POST') return notAllowed('POST');
  if (!env.MAIL_LINK_KEY || !env.DB) return json({error: 'not_configured'}, 503);
  if (!(await bearerMatches(request, env.MAIL_LINK_KEY))) return json({error: 'unauthorized'}, 401);
  const body = await readJson(request, 4 * 1024 * 1024);
  if (body.tooLarge) return json({error: 'too_large'}, 413);
  const items = Array.isArray(body.value?.messages) ? body.value.messages : null;
  if (!items || items.length > 200) return json({error: 'bad_request'}, 400);
  const rows = items.filter((m) => MSG_ID.test(String(m?.id || '')) && MAIL_ACCOUNTS[m?.account]
    && Number.isSafeInteger(m?.ts));
  const statements = rows.map((m) => env.DB.prepare(
    `INSERT OR REPLACE INTO mail_messages (id, account, thread_id, ts, day, direction, from_name, from_addr, to_addr, cc,
      to_ref, subject, snippet, category, body_text, body_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(m.id, m.account, clean(m.thread_id, 64), m.ts, clean(m.day, 10),
    DIRECTIONS.has(m.direction) ? m.direction : '', clean(m.from_name, 200), clean(m.from_addr, 200).toLowerCase(),
    clean(m.to_addr, 1000), clean(m.cc, 1000), clean(m.to_ref, 32), clean(m.subject, 500), clean(m.snippet, 400),
    clean(m.category, 30), String(m.body_text || '').slice(0, 100000), String(m.body_html || '').slice(0, 300000)));
  for (let index = 0; index < statements.length; index += 25) await env.DB.batch(statements.slice(index, index + 25));
  return json({ok: true, stored: rows.length, skipped: items.length - rows.length});
}

// GET /api/mail-messages?account=&day=&thread=&ref=&category=&direction=&q=&limit=&offset= (DASHBOARD_KEY) -> list (no bodies).
async function mailMessages(request, env) {
  if (request.method !== 'GET') return notAllowed('GET');
  if (!env.DASHBOARD_KEY) return json({error: 'not_configured'}, 503);
  if (!(await bearerMatches(request, env.DASHBOARD_KEY))) return json({error: 'unauthorized'}, 401);
  if (!env.DB) return json({error: 'no_database'}, 503);
  const p = new URL(request.url).searchParams;
  const account = p.get('account') || 'gmail';
  if (!MAIL_ACCOUNTS[account]) return json({error: 'unknown_account'}, 400);
  const where = ['account = ?'];
  const args = [account];
  const add = (sql, value) => { where.push(sql); args.push(value); };
  if (/^\d{4}-\d{2}-\d{2}$/.test(p.get('day') || '')) add('day = ?', p.get('day'));
  if (/^\d{4}-\d{2}$/.test(p.get('month') || '')) add('substr(day, 1, 7) = ?', p.get('month'));
  if (MSG_ID.test(p.get('thread') || '')) add('thread_id = ?', p.get('thread'));
  if (/^[a-f0-9]{8,32}$/.test(p.get('ref') || '')) add('to_ref = ?', p.get('ref'));
  if (/^[a-z_]{2,30}$/.test(p.get('category') || '')) add('category = ?', p.get('category'));
  if (DIRECTIONS.has(p.get('direction') || '')) add('direction = ?', p.get('direction'));
  const q = clean(p.get('q') || '', 80).toLowerCase();
  if (q) {
    where.push('(lower(subject) LIKE ? OR lower(from_addr) LIKE ? OR lower(to_addr) LIKE ? OR lower(from_name) LIKE ? OR lower(snippet) LIKE ?)');
    for (let i = 0; i < 5; i += 1) args.push(`%${q}%`);
  }
  const limit = Math.min(Math.max(parseInt(p.get('limit') || '50', 10) || 50, 1), 200);
  const offset = Math.min(Math.max(parseInt(p.get('offset') || '0', 10) || 0, 0), 100000);
  const order = p.get('order') === 'asc' ? 'ASC' : 'DESC';
  const sql = `FROM mail_messages WHERE ${where.join(' AND ')}`;
  const [list, total] = await env.DB.batch([
    env.DB.prepare(`SELECT id, thread_id, ts, day, direction, from_name, from_addr, to_addr, subject, snippet, category
      ${sql} ORDER BY ts ${order} LIMIT ? OFFSET ?`).bind(...args, limit, offset),
    env.DB.prepare(`SELECT COUNT(*) AS n ${sql}`).bind(...args),
  ]);
  return json({account, total: total.results?.[0]?.n || 0, limit, offset, messages: list.results || []});
}

// GET /api/mail-message?id= (DASHBOARD_KEY) -> one full mail.
async function mailMessage(request, env) {
  if (request.method !== 'GET') return notAllowed('GET');
  if (!env.DASHBOARD_KEY) return json({error: 'not_configured'}, 503);
  if (!(await bearerMatches(request, env.DASHBOARD_KEY))) return json({error: 'unauthorized'}, 401);
  if (!env.DB) return json({error: 'no_database'}, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!MSG_ID.test(id)) return json({error: 'bad_request'}, 400);
  const row = await env.DB.prepare('SELECT * FROM mail_messages WHERE id = ?').bind(id).first();
  return row ? json({message: row}) : json({error: 'not_found'}, 404);
}

// GET /api/mail-dashboard (DASHBOARD_KEY) -> every account (snapshot or placeholder) + all-time link clicks.
async function mailDashboard(request, env) {
  if (request.method !== 'GET') return notAllowed('GET');
  if (!env.DASHBOARD_KEY) return json({error: 'not_configured'}, 503);
  if (!(await bearerMatches(request, env.DASHBOARD_KEY))) return json({error: 'unauthorized'}, 401);
  if (!env.DB) return json({error: 'no_database'}, 503);
  const [snaps, clicks] = await env.DB.batch([
    env.DB.prepare('SELECT account, status, data, updated_at FROM mail_snapshots'),
    env.DB.prepare(`
      SELECT COUNT(*) AS sent,
        SUM(COALESCE(c.clicks, 0) > 0 OR COALESCE(c.pv, 0) > 0) AS clicked,
        SUM(COALESCE(c.pv, 0) > 0) AS opened,
        SUM(COALESCE(c.scans, 0) > 0 AND COALESCE(c.clicks, 0) = 0 AND COALESCE(c.pv, 0) = 0) AS scanner_only
      FROM mail_links l LEFT JOIN (
        SELECT camp, SUM(type = 'mail' AND zone = 'browser') AS clicks, SUM(type = 'mail' AND zone = 'scanner') AS scans,
          SUM(type = 'pageview') AS pv
        FROM events WHERE camp LIKE 'mail-%' GROUP BY camp
      ) c ON c.camp = 'mail-' || l.id
      WHERE l.mode = 'PRODUCTION'`),
  ]);
  const stored = Object.fromEntries((snaps.results || []).map((row) => [row.account, row]));
  const accounts = {};
  for (const [id, base] of Object.entries(MAIL_ACCOUNTS)) {
    const row = stored[id];
    let data = null;
    try { data = row?.data ? JSON.parse(row.data) : null; } catch { data = null; }
    accounts[id] = {address: base.address, status: row?.status || base.status, updated_at: row?.updated_at ?? null, data};
  }
  const c = clicks.results?.[0] || {};
  return json({
    generated_at: Math.floor(Date.now() / 1000),
    accounts,
    clicks: {sent: c.sent || 0, clicked: c.clicked || 0, opened: c.opened || 0, scanner_only: c.scanner_only || 0},
  });
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

/** Intent list for the AI route (a function: workerd only allows handler exports). */
export function aiIntents() { return AI_INTENTS; }

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/api/collect') return collect(request, env, ctx);
    if (path === '/api/lead') return lead(request, env, ctx);
    if (path === '/api/stats') return stats(request, env);
    if (path === '/api/mail-stats') return mailStats(request, env);
    if (path === '/api/mail-links') return mailLinks(request, env);
    if (path === '/api/mail-snapshot') return mailSnapshot(request, env);
    if (path === '/api/mail-dashboard') return mailDashboard(request, env);
    if (path === '/api/mail-archive') return mailArchive(request, env);
    if (path === '/api/mail-messages') return mailMessages(request, env);
    if (path === '/api/mail-message') return mailMessage(request, env);
    if (path === '/api/chat-ai') return chatAi(request, env, ctx);
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
