DROP POLICY IF EXISTS "anyone reads source runs" ON public.source_runs;
DROP POLICY IF EXISTS "anyone reads source locks" ON public.source_locks;
REVOKE SELECT ON public.source_runs, public.source_locks FROM anon, authenticated;
CREATE POLICY "mfa admins read source runs" ON public.source_runs FOR SELECT TO authenticated USING (public.is_mfa_admin());
CREATE POLICY "mfa admins read source locks" ON public.source_locks FOR SELECT TO authenticated USING (public.is_mfa_admin());
GRANT SELECT ON public.source_runs, public.source_locks TO authenticated;
GRANT ALL ON public.source_runs, public.source_locks TO service_role;
CREATE OR REPLACE FUNCTION public.public_source_summary() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object('runs', coalesce((SELECT jsonb_agg(jsonb_build_object('source_id', source_id, 'key', key, 'ok', ok, 'retrieved_at', retrieved_at, 'problem', CASE WHEN ok THEN NULL ELSE 'The latest refresh did not return usable data. Cached readings remain available with their original dates.' END)) FROM public.source_runs WHERE source_id IN ('worldbank','comtrade','gdelt','ecb')), '[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.public_source_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_source_summary() TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.claim_source_refresh(p_source_id text, p_force boolean, p_min_ms integer, p_floor_ms integer, p_max_run_ms integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lock public.source_locks%rowtype; v_now timestamptz := clock_timestamp(); v_wait integer;
BEGIN
 IF p_source_id NOT IN ('worldbank','comtrade','gdelt','ecb') OR least(p_min_ms,p_floor_ms,p_max_run_ms) < 1 THEN RAISE EXCEPTION 'Invalid source claim'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('source:' || p_source_id,0));
 SELECT * INTO v_lock FROM public.source_locks WHERE source_id=p_source_id LIMIT 1;
 IF FOUND THEN
  IF v_lock.finished_at IS NULL AND v_lock.started_at + p_max_run_ms * interval '1 millisecond' > v_now THEN RETURN jsonb_build_object('proceed',false,'reason','in_flight','retryInMs',ceil(extract(epoch FROM (v_lock.started_at + p_max_run_ms * interval '1 millisecond' - v_now))*1000)); END IF;
  v_wait := greatest(0,ceil(extract(epoch FROM ((CASE WHEN p_force AND v_lock.consecutive_failures=0 THEN v_lock.started_at + p_floor_ms * interval '1 millisecond' ELSE v_lock.next_allowed_at END) - v_now))*1000));
  IF v_wait>0 THEN RETURN jsonb_build_object('proceed',false,'reason','cooling_down','retryInMs',v_wait); END IF;
  UPDATE public.source_locks SET started_at=v_now,finished_at=NULL,attempts=attempts+1 WHERE id=v_lock.id;
 ELSE
  INSERT INTO public.source_locks(source_id,started_at,finished_at,next_allowed_at,attempts) VALUES(p_source_id,v_now,NULL,v_now+p_min_ms * interval '1 millisecond',1);
 END IF;
 RETURN jsonb_build_object('proceed',true);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_source_refresh(text,boolean,integer,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_source_refresh(text,boolean,integer,integer,integer) TO service_role;
CREATE TABLE public.request_windows (key_hash text PRIMARY KEY, started_at timestamptz NOT NULL DEFAULT now(), hits integer NOT NULL DEFAULT 0);
GRANT ALL ON public.request_windows TO service_role;
ALTER TABLE public.request_windows ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_request_window(p_key text,p_limit integer,p_window_seconds integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row public.request_windows%rowtype; v_now timestamptz := clock_timestamp();
BEGIN
 IF p_key !~ '^[a-f0-9]{64}$' OR p_limit<1 OR p_window_seconds<1 THEN RAISE EXCEPTION 'Invalid request claim'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,0));
 SELECT * INTO v_row FROM public.request_windows WHERE key_hash=p_key;
 IF NOT FOUND THEN INSERT INTO public.request_windows(key_hash,started_at,hits) VALUES(p_key,v_now,1); RETURN jsonb_build_object('ok',true); END IF;
 IF v_row.started_at + p_window_seconds * interval '1 second' <= v_now THEN UPDATE public.request_windows SET started_at=v_now,hits=1 WHERE key_hash=p_key; RETURN jsonb_build_object('ok',true); END IF;
 IF v_row.hits>=p_limit THEN RETURN jsonb_build_object('ok',false,'waitSeconds',ceil(extract(epoch FROM(v_row.started_at+p_window_seconds * interval '1 second'-v_now)))); END IF;
 UPDATE public.request_windows SET hits=hits+1 WHERE key_hash=p_key;
 RETURN jsonb_build_object('ok',true);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_request_window(text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_request_window(text,integer,integer) TO service_role;
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_kind_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_kind_check CHECK(kind IN ('sample','report','pilot','contact','waitlist'));
DROP POLICY IF EXISTS "anyone submits inquiry" ON public.inquiries;
REVOKE INSERT ON public.inquiries FROM anon,authenticated;