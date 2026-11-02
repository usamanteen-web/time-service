import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker, {MAIL_ACCOUNTS} from './video-worker.mjs';

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
const KEY = 'test-dashboard-key-1234567890abcdef';
const LINK_KEY = 'test-mail-link-key-abcdef1234567890';
const setup = () => {
  const d1 = makeD1();
  return {d1, env: {ASSETS: {fetch: async () => new Response('static')}, DB: d1, DASHBOARD_KEY: KEY, MAIL_LINK_KEY: LINK_KEY}};
};
const post = (key, body) => new Request(`${ORIGIN}/api/mail-snapshot`, {method: 'POST', headers: {Authorization: `Bearer ${key}`}, body: JSON.stringify(body)});
const dash = (key) => new Request(`${ORIGIN}/api/mail-dashboard`, {headers: key ? {Authorization: `Bearer ${key}`} : {}});

test('mail-dashboard needs the dashboard key', async () => {
  const {env} = setup();
  assert.equal((await worker.fetch(dash(), env)).status, 401);
  assert.equal((await worker.fetch(dash(LINK_KEY), env)).status, 401, 'mailer key must not read the dashboard');
  assert.equal((await worker.fetch(dash(KEY), env)).status, 200);
});

test('without snapshots every account is a placeholder with its default status', async () => {
  const {env} = setup();
  const body = await (await worker.fetch(dash(KEY), env)).json();
  assert.deepEqual(Object.keys(body.accounts), ['gmail', 'domain', 'harry']);
  assert.equal(body.accounts.harry.address, 'pimchanok.event@gmail.com');
  assert.equal(body.accounts.domain.status, 'waiting_domain');
  for (const account of Object.values(body.accounts)) assert.equal(account.data, null);
  assert.deepEqual(body.clicks, {sent: 0, clicked: 0, opened: 0, scanner_only: 0});
});

test('mail-snapshot stores the latest snapshot per account; only the mailer key may write', async () => {
  const {env} = setup();
  assert.equal((await worker.fetch(post(KEY, {account: 'gmail', data: {total: 1}}), env)).status, 401);
  assert.equal((await worker.fetch(post(LINK_KEY, {account: 'nobody', data: {}}), env)).status, 400);
  assert.equal((await worker.fetch(post(LINK_KEY, {account: 'gmail', status: 'sending', data: {total: 1}}), env)).status, 200);
  assert.equal((await worker.fetch(post(LINK_KEY, {account: 'gmail', status: 'bogus', data: {total: 2, sent_companies: 639}}), env)).status, 200);
  const body = await (await worker.fetch(dash(KEY), env)).json();
  assert.equal(body.accounts.gmail.status, MAIL_ACCOUNTS.gmail.status, 'unknown status falls back to the default');
  assert.deepEqual(body.accounts.gmail.data, {total: 2, sent_companies: 639});
  assert.ok(body.accounts.gmail.updated_at > 0);
  assert.equal(body.accounts.harry.data, null);
});

test('mail-dashboard counts all-time production link clicks', async () => {
  const {d1, env} = setup();
  const now = Math.floor(Date.now() / 1000);
  for (const [id, mode] of [['aaa111bbb', 'PRODUCTION'], ['ccc222ddd', 'PRODUCTION'], ['qa1234567', 'TEST']]) {
    d1.db.prepare("INSERT INTO mail_links (id, company, email, template, campaign, mode, sent_ts) VALUES (?, 'X', 'x@x.test', 'exhibitor_th', 'INTRO-2026Q4', ?, ?)").run(id, mode, now);
  }
  d1.db.prepare("INSERT INTO events (ts, day, type, path, zone, camp, visitor) VALUES (?, '2026-11-02', 'mail', '/r', 'browser', 'mail-aaa111bbb', 'v')").run(now);
  d1.db.prepare("INSERT INTO events (ts, day, type, path, zone, camp, visitor) VALUES (?, '2026-11-02', 'pageview', '/', '', 'mail-aaa111bbb', 'v')").run(now);
  d1.db.prepare("INSERT INTO events (ts, day, type, path, zone, camp, visitor) VALUES (?, '2026-11-02', 'mail', '/r', 'scanner', 'mail-ccc222ddd', 'v')").run(now);
  const body = await (await worker.fetch(dash(KEY), env)).json();
  assert.deepEqual(body.clicks, {sent: 2, clicked: 1, opened: 1, scanner_only: 1});
});
