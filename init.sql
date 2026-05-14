CREATE TABLE IF NOT EXISTS links (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(50) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id         SERIAL PRIMARY KEY,
  link_id    INTEGER REFERENCES links(id) ON DELETE CASCADE,
  ip         VARCHAR(50) NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visits_link_id_idx ON visits(link_id);
