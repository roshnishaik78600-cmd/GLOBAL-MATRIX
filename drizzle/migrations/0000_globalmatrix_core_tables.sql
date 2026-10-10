-- User-owned research state
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own watchlist" ON public.watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own watchlist" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own watchlist" ON public.watchlist FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own watchlist" ON public.watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annotations TO authenticated;
GRANT ALL ON public.annotations TO service_role;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own annotations" ON public.annotations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own annotations" ON public.annotations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own annotations" ON public.annotations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.exposure_deps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('node', 'industry')),
  ref_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exposure_deps TO authenticated;
GRANT ALL ON public.exposure_deps TO service_role;
ALTER TABLE public.exposure_deps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own deps" ON public.exposure_deps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own deps" ON public.exposure_deps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own deps" ON public.exposure_deps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI brief throttle: one claim row per accepted generation run
CREATE TABLE public.brief_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.brief_claims TO authenticated;
GRANT ALL ON public.brief_claims TO service_role;
ALTER TABLE public.brief_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own claims" ON public.brief_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own claims" ON public.brief_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  thesis TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  caveats TEXT[] NOT NULL DEFAULT '{}',
  model TEXT NOT NULL,
  corpus_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefs TO authenticated;
GRANT ALL ON public.briefs TO service_role;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own briefs" ON public.briefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own briefs" ON public.briefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Source connector cache: publicly readable, written only by server-side connectors
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  key TEXT NOT NULL,
  as_of TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL,
  note TEXT,
  ok BOOLEAN NOT NULL DEFAULT true,
  problem TEXT,
  payload TEXT NOT NULL,
  UNIQUE (source_id, key)
);
GRANT SELECT ON public.observations TO anon, authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads observations" ON public.observations FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.source_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  key TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  as_of TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reading_count INT NOT NULL DEFAULT 0,
  problem TEXT,
  UNIQUE (source_id, key)
);
GRANT SELECT ON public.source_runs TO anon, authenticated;
GRANT ALL ON public.source_runs TO service_role;
ALTER TABLE public.source_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads source runs" ON public.source_runs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.source_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  consecutive_failures INT NOT NULL DEFAULT 0,
  next_allowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INT NOT NULL DEFAULT 0,
  failures INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.source_locks TO anon, authenticated;
GRANT ALL ON public.source_locks TO service_role;
ALTER TABLE public.source_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads source locks" ON public.source_locks FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX idx_watchlist_user ON public.watchlist (user_id);
CREATE INDEX idx_annotations_user_event ON public.annotations (user_id, event_id);
CREATE INDEX idx_briefs_user_event ON public.briefs (user_id, event_id);
CREATE INDEX idx_observations_source ON public.observations (source_id);
CREATE INDEX idx_source_runs_source ON public.source_runs (source_id);