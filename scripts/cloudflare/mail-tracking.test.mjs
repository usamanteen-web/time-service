import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './video-worker.mjs';

function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    run: async () => { db.prepare(sql).run(...args); return {success: true}; },
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({results: db.prepare(sql).all(...args)}),
  });
  return {db, prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((item) => (item.all ? item.all() : item)))};
}

const ORIGIN = 'https://www.timeservices.co';
const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const KEY = 'test-dashboard-key-1234567890abcdef';
const LINK_KEY = 'test-mail-link-key-abcdef1234567890';
const setup = (extra = {}) => {
  const d1 = makeD1();
  return {d1, env: {ASSETS: {fetch: async () => new Response('static')}, DB: d1, DASHBOARD_KEY: KEY, MAIL_LINK_KEY: LINK_KEY, ...extra}};
};
const get = (path, ua = SAFARI) => new Request(`${ORIGIN}${path}`, {headers: {'User-Agent': ua, 'CF-Connecting-IP': '203.0.113.9'}});

test('mail link redirects to home with utm tags and records a browser click', async () => {
  const {d1, env} = setup();
  const response = await worker.fetch(get('/r/abc123xyz'), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get('Location'));
  assert.equal(location.pathname, '/');
  assert.equal(location.searchParams.get('utm_source'), 'email');
  assert.equal(location.searchParams.get('utm_campaign'), 'mail-abc123xyz');
  const rows = d1.db.prepare("SELECT type, item, zone, camp FROM events").all();
  assert.deepEqual(rows.map((r) => ({...r})), [{type: 'mail', item: 'abc123xyz', zone: 'browser', camp: 'mail-abc123xyz'}]);
});

test('mail security scanners are recorded as scanner, not as a person', async () => {
  const {d1, env} = setup();
  await worker.fetch(get('/r/abc123xyz', 'Mozilla/5.0 (compatible; Mimecast URL Protect)'), env);
  await worker.fetch(get('/r/abc123xyz', 'python-requests/2.31'), env);
  const zones = d1.db.prepare('SELECT zone FROM events').all().map((r) => r.zone);
  assert.deepEqual(zones, ['scanner', 'scanner']);
});

test('malformed link ids still redirect home but store nothing', async () => {
  const {d1, env} = setup();
  for (const path of ['/r/', '/r/<script>', '/r/' + 'a'.repeat(60), '/r/AB']) {
    const response = await worker.fetch(get(path), env);
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get('Location')).search, '');
  }
  assert.equal(d1.db.prepare('SELECT COUNT(*) AS n FROM events').get().n, 0);
});

test('mail-links registration needs its own key and stores rows', async () => {
  const {d1, env} = setup();
  const body = JSON.stringify({links: [
    {id: 'abc123xyz', company: 'ACME Co', email: 'Info@Acme.test', template: 'exhibitor_th', campaign: 'INTRO-2026Q4', mode: 'PRODUCTION', sent_ts: 1793400000},
    {id: 'bad id!', company: 'X'},
  ]});
  const post = (key) => new Request(`${ORIGIN}/api/mail-links`, {method: 'POST', headers: {Authorization: `Bearer ${key}`}, body});
  assert.equal((await worker.fetch(post(KEY), env)).status, 401, 'dashboard key must not register links');
  const response = await worker.fetch(post(LINK_KEY), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, stored: 1, skipped: 1});
  assert.equal(d1.db.prepare('SELECT email FROM mail_links').get().email, 'info@acme.test');
});

test('mail-stats joins clicks and the following page view to the company', async () => {
  const {d1, env} = setup();
  const now = Math.floor(Date.now() / 1000);
  d1.db.prepare("INSERT INTO mail_links (id, company, email, template, campaign, mode, sent_ts) VALUES ('abc123xyz','ACME Co','info@acme.test','exhibitor_th','INTRO-2026Q4','PRODUCTION',?)").run(now - 3600);
  d1.db.prepare("INSERT INTO mail_links (id, company, email, template, campaign, mode, sent_ts) VALUES ('zzz999yyy','Quiet Co','q@quiet.test','exhibitor_en','INTRO-2026Q4','PRODUCTION',?)").run(now - 3600);
  await worker.fetch(get('/r/abc123xyz'), env);
  const view = new Request(`${ORIGIN}/api/collect`, {method: 'POST', headers: {'User-Agent': SAFARI, Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.9'},
    body: JSON.stringify({t: 'pageview', p: '/', r: 'email', cp: 'mail-abc123xyz', e: 1})});
  assert.equal((await worker.fetch(view, env)).status, 204);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/mail-stats`), env)).status, 401);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/mail-stats`, {headers: {Authorization: `Bearer ${KEY}`}}), env);
  const data = await response.json();
  assert.equal(data.sent, 2);
  assert.equal(data.clickedCompanies, 1);
  assert.equal(data.openedSite, 1);
  assert.equal(data.people[0].company, 'ACME Co');
  assert.equal(data.people[0].clicks, 1);
  assert.equal(data.people[0].pageviews, 1);
});

test('mail-stats splits results by campaign and can filter to one campaign', async () => {
  const {d1, env} = setup();
  const now = Math.floor(Date.now() / 1000);
  const add = (id, company, template, campaign) => d1.db.prepare(
    "INSERT INTO mail_links (id, company, email, template, campaign, mode, sent_ts) VALUES (?, ?, ?, ?, ?, 'PRODUCTION', ?)",
  ).run(id, company, `${id}@x.test`, template, campaign, now - 600);
  add('intro00001', 'A Co', 'exhibitor_th', 'INTRO-2026Q4');
  add('intro00002', 'B Co', 'exhibitor_th', 'INTRO-2026Q4');
  add('intro00003', 'C Co', 'transport_en', 'INTRO-2026Q4');
  add('vivasia001', 'D Co', 'exhibitor_en', 'VIV-Asia-2027');
  add('vivasia002', 'E Co', 'exhibitor_en', 'VIV-Asia-2027');
  await worker.fetch(get('/r/intro00001'), env);
  await worker.fetch(get('/r/vivasia001', 'Mozilla/5.0 (compatible; Mimecast URL Protect)'), env);
  await worker.fetch(get('/r/vivasia002'), env);
  const auth = {headers: {Authorization: `Bearer ${KEY}`}};
  const all = await (await worker.fetch(new Request(`${ORIGIN}/api/mail-stats`, auth), env)).json();
  assert.deepEqual(all.campaignList, ['INTRO-2026Q4', 'VIV-Asia-2027']);
  assert.equal(all.sent, 5);
  const row = (campaign, template) => all.byCampaign.find((r) => r.campaign === campaign && r.template === template);
  assert.deepEqual([row('INTRO-2026Q4', 'exhibitor_th').sent, row('INTRO-2026Q4', 'exhibitor_th').clicked], [2, 1]);
  assert.deepEqual([row('INTRO-2026Q4', 'transport_en').sent, row('INTRO-2026Q4', 'transport_en').clicked], [1, 0]);
  assert.deepEqual([row('VIV-Asia-2027', 'exhibitor_en').sent, row('VIV-Asia-2027', 'exhibitor_en').clicked, row('VIV-Asia-2027', 'exhibitor_en').scanner_only], [2, 1, 1]);
  assert.ok(all.people.every((p) => p.campaign), 'every person row names its campaign');
  const viv = await (await worker.fetch(new Request(`${ORIGIN}/api/mail-stats?campaign=VIV-Asia-2027`, auth), env)).json();
  assert.equal(viv.campaign, 'VIV-Asia-2027');
  assert.equal(viv.sent, 2);
  assert.deepEqual(viv.people.map((p) => p.company).sort(), ['D Co', 'E Co']);
  assert.equal(viv.clickedCompanies, 1);
  assert.equal(viv.scannerOnly, 1);
});

test('lead alert is pushed to LINE when the OA token is set, and skipped when not', async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls.push({url: String(url), init}); return new Response('{}'); };
  try {
    const waits = [];
    const ctx = {waitUntil: (p) => waits.push(p)};
    const lead = () => new Request(`${ORIGIN}/api/lead`, {method: 'POST', headers: {'User-Agent': SAFARI, Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.10'},
      body: JSON.stringify({name: 'Somchai', contact: '0812345678', message: 'Booth 36 sqm', p: '/contact/'})});
    const off = setup();
    assert.equal((await worker.fetch(lead(), off.env, ctx)).status, 200);
    assert.equal(calls.length, 0);
    const on = setup({LINE_CHANNEL_TOKEN: 'line-token', LINE_TO: 'U1234567890abcdef'});
    assert.equal((await worker.fetch(lead(), on.env, ctx)).status, 200);
    await Promise.all(waits);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.line.me/v2/bot/message/push');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer line-token');
    const sent = JSON.parse(calls[0].init.body);
    assert.equal(sent.to, 'U1234567890abcdef');
    assert.match(sent.messages[0].text, /Somchai/);
    assert.match(sent.messages[0].text, /0812345678/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
