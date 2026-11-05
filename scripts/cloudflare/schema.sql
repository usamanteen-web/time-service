CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL DEFAULT '',
  zone TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  camp TEXT NOT NULL DEFAULT '',
  entry INTEGER NOT NULL DEFAULT 0,
  device TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  visitor TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_type_day ON events (type, day);
CREATE INDEX IF NOT EXISTS idx_events_click ON events (type, category, item);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  visitor TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_day ON leads (day);

-- E-mail link tracking: one row per sent intro e-mail (id is the opaque token in https://www.timeservices.co/r/<id>).
CREATE TABLE IF NOT EXISTS mail_links (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'PRODUCTION',
  sent_ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mail_links_sent ON mail_links (mode, sent_ts);
CREATE INDEX IF NOT EXISTS idx_events_camp ON events (camp);

-- Mail-sending dashboard: latest snapshot per sender account (gmail | domain | harry), pushed by the Mac mailer.
CREATE TABLE IF NOT EXISTS mail_snapshots (
  account TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT '',
  data TEXT,
  updated_at INTEGER NOT NULL
);

-- Mail archive for the owner dashboard (Teen 2026-11-03: "ต้องอ่านเมลจริงนั้นๆได้"). Full copies of the sent intro
-- mails (account gmail, with their replies) and Harry's threads seen in Pimchanok's mailbox (account harry).
-- Pushed by the Mac (MAIL_LINK_KEY), read only with DASHBOARD_KEY. to_ref = first 16 hex of sha256(lower(to address)).
CREATE TABLE IF NOT EXISTS mail_messages (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  thread_id TEXT NOT NULL DEFAULT '',
  ts INTEGER NOT NULL,
  day TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  from_addr TEXT NOT NULL DEFAULT '',
  to_addr TEXT NOT NULL DEFAULT '',
  cc TEXT NOT NULL DEFAULT '',
  to_ref TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_mail_messages_acc_ts ON mail_messages (account, ts);
CREATE INDEX IF NOT EXISTS idx_mail_messages_acc_day ON mail_messages (account, day);
CREATE INDEX IF NOT EXISTS idx_mail_messages_thread ON mail_messages (account, thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_ref ON mail_messages (account, to_ref);
CREATE INDEX IF NOT EXISTS idx_mail_messages_campaign ON mail_messages (account, campaign, ts);
