import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker, {bangkokDay, deviceOf} from './video-worker.mjs';

function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    run: async () => { db.prepare(sql).run(...args); return {success: true}; },
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({results: db.prepare(sql).all(...args)}),
  });
  return {db, prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((item) => item.all()))};
}

const ORIGIN = 'https://www.timeservices.co';
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const KEY = 'test-dashboard-key-1234567890abcdef';

const setup = (extra = {}) => {
  const d1 = makeD1();
  return {d1, env: {ASSETS: {fetch: async () => new Response('static')}, DB: d1, DASHBOARD_KEY: KEY, ...extra}};
};
const post = (path, body, {ua = CHROME, origin = ORIGIN, ip = '203.0.113.7', country} = {}) => {
  const headers = {'User-Agent': ua, 'CF-Connecting-IP': ip, 'Content-Type': 'text/plain'};
  if (origin) headers.Origin = origin;
  const request = new Request(`${ORIGIN}${path}`, {method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body)});
  if (country) Object.defineProperty(request, 'cf', {value: {country}});
  return request;
};
const rows = (d1, sql, ...args) => d1.db.prepare(sql).all(...args);

test('pageview is stored with Bangkok day, entry flag, device and country', async () => {
  const {d1, env} = setup();
  const response = await worker.fetch(post('/api/collect', {t: 'pageview', p: '/projects/', r: 'Google.com', cp: 'spring', e: 1}, {ua: IPHONE, country: 'TH'}), env);
  assert.equal(response.status, 204);
  const [row] = rows(d1, 'SELECT * FROM events');
  assert.equal(row.type, 'pageview');
  assert.equal(row.path, '/projects/');
  assert.equal(row.ref, 'google.com');
  assert.equal(row.camp, 'spring');
  assert.equal(row.entry, 1);
  assert.equal(row.device, 'mobile');
  assert.equal(row.country, 'TH');
  assert.equal(row.day, bangkokDay(Date.now()));
});

test('click keeps category and item but drops free text; chat keeps label', async () => {
  const {d1, env} = setup();
  await worker.fetch(post('/api/collect', {t: 'click', p: '/', c: 'project', i: 'Event Organizer', z: 'page', l: 'secret text', r: 'x.com'}), env);
  await worker.fetch(post('/api/collect', {t: 'chat', p: '/', c: 'chat', i: 'unmatched', z: 'chat', l: 'ทำบูธราคาเท่าไหร่'}), env);
  const [click, chat] = rows(d1, 'SELECT * FROM events ORDER BY id');
  assert.deepEqual([click.category, click.item, click.zone, click.label, click.ref], ['project', 'Event Organizer', 'page', '', '']);
  assert.deepEqual([chat.item, chat.label], ['unmatched', 'ทำบูธราคาเท่าไหร่']);
});

test('IP address is never stored and the visitor id is stable per person per day', async () => {
  const {d1, env} = setup();
  const same = {t: 'pageview', p: '/'};
  await worker.fetch(post('/api/collect', same, {ip: '198.51.100.9'}), env);
  await worker.fetch(post('/api/collect', same, {ip: '198.51.100.9'}), env);
  await worker.fetch(post('/api/collect', same, {ip: '198.51.100.10'}), env);
  const all = rows(d1, 'SELECT * FROM events');
  assert.equal(all[0].visitor, all[1].visitor);
  assert.notEqual(all[0].visitor, all[2].visitor);
  assert.equal(JSON.stringify(all).includes('198.51.100'), false);
});

test('bots, foreign origins, bad payloads and non-POST are ignored', async () => {
  const {d1, env} = setup();
  const event = {t: 'pageview', p: '/'};
  assert.equal((await worker.fetch(post('/api/collect', event, {ua: 'Googlebot/2.1'}), env)).status, 204);
  assert.equal((await worker.fetch(post('/api/collect', event, {origin: 'https://evil.example'}), env)).status, 204);
  assert.equal((await worker.fetch(post('/api/collect', event, {origin: null}), env)).status, 204);
  assert.equal((await worker.fetch(post('/api/collect', 'not json'), env)).status, 400);
  assert.equal((await worker.fetch(post('/api/collect', {t: 'hack', p: '/'}), env)).status, 400);
  assert.equal((await worker.fetch(post('/api/collect', {t: 'pageview', p: 'no-slash'}), env)).status, 400);
  assert.equal((await worker.fetch(post('/api/collect', 'x'.repeat(5000)), env)).status, 413);
  const get = await worker.fetch(new Request(`${ORIGIN}/api/collect`), env);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('Allow'), 'POST');
  assert.equal(rows(d1, 'SELECT COUNT(*) AS n FROM events')[0].n, 0);
});

test('allowed hosts can be overridden for local testing', async () => {
  const {d1, env} = setup({ALLOWED_HOSTS: 'localhost, 127.0.0.1'});
  await worker.fetch(post('/api/collect', {t: 'pageview', p: '/'}, {origin: 'http://localhost:8788'}), env);
  await worker.fetch(post('/api/collect', {t: 'pageview', p: '/'}), env);
  assert.equal(rows(d1, 'SELECT COUNT(*) AS n FROM events')[0].n, 1);
});

test('missing database never breaks the site', async () => {
  const env = {ASSETS: {fetch: async () => new Response('static')}};
  assert.equal((await worker.fetch(post('/api/collect', {t: 'pageview', p: '/'}), env)).status, 204);
  assert.equal((await worker.fetch(post('/api/lead', {name: 'a', contact: 'b'}), env)).status, 503);
});

test('unknown /api paths return 404 JSON and other paths stay static', async () => {
  const {env} = setup();
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/nope`), env)).status, 404);
  assert.equal(await (await worker.fetch(new Request(`${ORIGIN}/about/`), env)).text(), 'static');
});

test('lead is saved, normalised and rate limited to five a day', async () => {
  const {d1, env} = setup();
  const lead = {name: '  Somchai  ', contact: '081-234-5678', message: 'Booth 6x3\nGem fair', p: '/contact/'};
  const response = await worker.fetch(post('/api/lead', lead), env);
  assert.deepEqual(await response.json(), {ok: true});
  const [row] = rows(d1, 'SELECT * FROM leads');
  assert.deepEqual([row.name, row.contact, row.message, row.path], ['Somchai', '081-234-5678', 'Booth 6x3\nGem fair', '/contact/']);
  for (let count = 0; count < 4; count += 1) await worker.fetch(post('/api/lead', lead), env);
  assert.equal((await worker.fetch(post('/api/lead', lead), env)).status, 429);
  assert.equal(rows(d1, 'SELECT COUNT(*) AS n FROM leads')[0].n, 5);
});

test('lead rejects missing fields and silently drops honeypot and bots', async () => {
  const {d1, env} = setup();
  assert.equal((await worker.fetch(post('/api/lead', {name: 'A', contact: ''}), env)).status, 422);
  assert.equal((await worker.fetch(post('/api/lead', {name: 'A', contact: 'B', hp: 'http://spam'}), env)).status, 200);
  assert.equal((await worker.fetch(post('/api/lead', {name: 'A', contact: 'B'}, {ua: 'python-requests/2.0'}), env)).status, 200);
  assert.equal((await worker.fetch(post('/api/lead', {name: 'A', contact: 'B'}, {origin: 'https://evil.example'}), env)).status, 403);
  assert.equal(rows(d1, 'SELECT COUNT(*) AS n FROM leads')[0].n, 0);
});

test('lead webhook is notified without allowing mass mentions', async () => {
  const {env} = setup({LEAD_WEBHOOK_URL: 'https://hooks.example/lead'});
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => { calls.push({url, body: JSON.parse(options.body)}); return new Response('ok'); };
  try {
    const pending = [];
    await worker.fetch(post('/api/lead', {name: '@everyone', contact: 'line: abc'}), env, {waitUntil: (promise) => pending.push(promise)});
    await Promise.all(pending);
  } finally { globalThis.fetch = original; }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://hooks.example/lead');
  assert.deepEqual(calls[0].body.allowed_mentions, {parse: []});
  assert.match(calls[0].body.content, /line: abc/);
});

test('stats requires the dashboard key', async () => {
  const {env} = setup();
  const call = (headers, e = env) => worker.fetch(new Request(`${ORIGIN}/api/stats`, {headers}), e);
  assert.equal((await call({})).status, 401);
  assert.equal((await call({Authorization: 'Bearer wrong'})).status, 401);
  assert.equal((await call({Authorization: `Bearer ${KEY}`})).status, 200);
  assert.equal((await call({}, {...env, DASHBOARD_KEY: undefined})).status, 503);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/stats`, {method: 'POST', headers: {Authorization: `Bearer ${KEY}`}}), env)).status, 405);
});

function seed(d1) {
  const insert = d1.db.prepare('INSERT INTO events (ts, day, type, path, category, item, zone, label, ref, camp, entry, device, country, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const at = (day, hh, mm = 0) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 1000) + hh * 3600 + mm * 60;
  const view = (day, hh, visitor, path, entry, ref = '', device = 'desktop', country = 'TH') => insert.run(at(day, hh), day, 'pageview', path, '', '', '', '', ref, '', entry, device, country, visitor);
  const click = (day, hh, visitor, category, item) => insert.run(at(day, hh), day, 'click', '/', category, item, 'page', '', '', '', 0, 'desktop', 'TH', visitor);
  const chat = (day, hh, visitor, item, label = '') => insert.run(at(day, hh), day, 'chat', '/', 'chat', item, 'chat', label, '', '', 0, 'desktop', 'TH', visitor);
  // previous period (2026-10-24..2026-10-26 when range is 27..29)
  view('2026-10-24', 3, 'p1', '/', 1);
  view('2026-10-25', 3, 'p2', '/', 1);
  click('2026-10-25', 3, 'p2', 'project', 'Event Organizer');
  // current period
  view('2026-10-27', 2, 'a', '/', 1, 'google.com');
  view('2026-10-27', 2, 'a', '/projects/', 0);
  view('2026-10-27', 5, 'b', '/', 1, '', 'mobile', 'US');
  view('2026-10-28', 17, 'c', '/services/', 1, 'google.com');
  click('2026-10-27', 2, 'a', 'project', 'Event Organizer');
  click('2026-10-27', 2, 'b', 'project', 'Event Organizer');
  click('2026-10-28', 17, 'c', 'service', 'Lighting & Sound Systems');
  click('2026-10-28', 17, 'c', 'contact', 'LINE');
  chat('2026-10-27', 2, 'a', 'open');
  chat('2026-10-27', 2, 'a', 'topic:services');
  chat('2026-10-28', 17, 'c', 'unmatched', 'มีที่จอดรถไหม');
  d1.db.prepare('INSERT INTO leads (ts, day, name, contact, message, path, visitor) VALUES (?, ?, ?, ?, ?, ?, ?)').run(at('2026-10-28', 17, 30), '2026-10-28', 'Nok', '0812345678', 'Gem fair booth', '/contact/', 'c');
}

test('stats aggregates visits, visitors, clicks, sources and compares with the previous period', async () => {
  const {d1, env} = setup();
  seed(d1);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/stats?from=2026-10-27&to=2026-10-29`, {headers: {Authorization: `Bearer ${KEY}`}}), env);
  const data = await response.json();
  assert.deepEqual(data.range, {from: '2026-10-27', to: '2026-10-29', days: 3, prevFrom: '2026-10-24', prevTo: '2026-10-26'});
  assert.deepEqual(data.totals, {visits: 3, visitors: 3, pageviews: 4, clicks: 4, chatOpens: 1, leads: 1});
  assert.deepEqual(data.previous, {visits: 2, visitors: 2, pageviews: 2, clicks: 1, chatOpens: 0, leads: 0});
  assert.deepEqual(data.daily.map((d) => [d.day, d.visits, d.pageviews, d.visitors]), [['2026-10-27', 2, 3, 2], ['2026-10-28', 1, 1, 1], ['2026-10-29', 0, 0, 0]]);
  assert.deepEqual(data.clicks[0], {category: 'project', item: 'Event Organizer', n: 2, people: 2});
  assert.equal(data.clicks.length, 3);
  assert.deepEqual(data.sources, [{name: 'google.com', n: 2}, {name: 'direct', n: 1}]);
  assert.deepEqual(data.devices.map((d) => d.name).sort(), ['desktop', 'mobile']);
  assert.deepEqual(data.pages[0], {path: '/', pageviews: 2, visitors: 2});
  assert.equal(data.hours[9], 2);
  assert.equal(data.hours[0], 1);
  assert.equal(data.hours[12], 1);
  assert.equal(data.hours[13], 0);
  assert.deepEqual(data.chat.map((c) => [c.name, c.n]).sort(), [['open', 1], ['topic:services', 1], ['unmatched', 1]]);
  assert.equal(data.unmatched[0].label, 'มีที่จอดรถไหม');
  assert.equal(data.leads[0].name, 'Nok');
});

test('stats defaults to the last seven days and caps very long ranges', async () => {
  const {env} = setup();
  const get = async (query) => (await worker.fetch(new Request(`${ORIGIN}/api/stats${query}`, {headers: {Authorization: `Bearer ${KEY}`}}), env)).json();
  const week = await get('');
  assert.equal(week.range.days, 7);
  assert.equal(week.range.to, bangkokDay(Date.now()));
  assert.equal((await get('?from=2020-01-01&to=2026-10-29')).range.days, 366);
  assert.equal((await get('?from=garbage&to=2026-10-29')).range.days, 7);
});

test('device detection', () => {
  assert.equal(deviceOf(IPHONE), 'mobile');
  assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
  assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari'), 'mobile');
  assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14; SM-X900) Safari'), 'tablet');
  assert.equal(deviceOf(CHROME), 'desktop');
});
