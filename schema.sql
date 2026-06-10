-- FlixoraPlay D1 Database Schema
-- Run: wrangler d1 execute flixoraplay-db --file=./schema.sql --remote

CREATE TABLE IF NOT EXISTS competitions (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  theme       TEXT,
  prize       TEXT,
  prize_pool_cents INTEGER DEFAULT 0,
  prize_funded INTEGER DEFAULT 0,
  maxDuration INTEGER DEFAULT 15,
  deadline    TEXT NOT NULL,
  status      TEXT DEFAULT 'open',
  hostId      TEXT,
  hostName    TEXT,
  judging     TEXT DEFAULT 'manual',
  createdAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
  id            TEXT PRIMARY KEY,
  competitionId TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  videoUrl      TEXT,
  creatorId     TEXT,
  creatorName   TEXT,
  tools         TEXT DEFAULT '[]',
  score         REAL DEFAULT 0,
  rank          INTEGER,
  votes         INTEGER DEFAULT 0,
  submittedAt   TEXT NOT NULL,
  FOREIGN KEY (competitionId) REFERENCES competitions(id)
);

CREATE TABLE IF NOT EXISTS votes (
  id        TEXT PRIMARY KEY,
  entryId   TEXT NOT NULL,
  voterId   TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(entryId, voterId),
  FOREIGN KEY (entryId) REFERENCES entries(id)
);

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role         TEXT DEFAULT 'creator',
  verified     INTEGER DEFAULT 0,
  avatar_url   TEXT,
  bio          TEXT DEFAULT '',
  total_points INTEGER DEFAULT 0,
  google_id    TEXT,
  createdAt    TEXT NOT NULL
);

-- Seed demo data
INSERT OR IGNORE INTO competitions VALUES
  ('c1','Sci-Fi Visions 2025','Create a cinematic sci-fi AI-generated video in under 60 seconds. Think space, future cities, alien landscapes.','Sci-fi short under 60 seconds','$500',60,'2026-07-30','open','u_host1','Neon Studios','manual','2026-04-01'),
  ('c2','Nature Reimagined','Show nature like never seen before using AI video generation tools. Forests, oceans, mountains — reimagined.','AI-rendered nature scenes','$300',30,'2026-08-15','open','u_host2','EarthFrame Co.','manual','2026-04-05'),
  ('c3','Human Emotion Reel','Tell an emotional story using AI-generated visuals. No dialogue needed. Express through imagery.','Emotion storytelling under 90s',NULL,90,'2026-03-20','judging','u_host1','Neon Studios','manual','2026-03-01');

INSERT OR IGNORE INTO entries VALUES
  ('e1','c3','The Last Teardrop','An AI film depicting the final moments of memory fading away.','https://www.youtube.com/watch?v=dQw4w9WgXcQ','u_c1','Arya Mehta','["Runway ML","Midjourney"]',92,1,47,'2026-03-10'),
  ('e2','c3','Echoes of Childhood','Nostalgic memories visualized through dreamy AI landscapes.','https://www.youtube.com/watch?v=dQw4w9WgXcQ','u_c2','Dev Patel','["Pika Labs","Stable Video"]',85,2,32,'2026-03-11'),
  ('e3','c3','Joy in the Rain','Pure happiness rendered through AI-generated rain scenes.','https://www.youtube.com/watch?v=dQw4w9WgXcQ','u_c3','Priya Singh','["Sora","Kling AI"]',78,3,26,'2026-03-12');

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read INTEGER DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL,
  payer_id TEXT NOT NULL,
  payee_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES competitions(id)
);


