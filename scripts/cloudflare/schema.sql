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
