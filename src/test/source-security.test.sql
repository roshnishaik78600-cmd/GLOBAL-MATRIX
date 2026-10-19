BEGIN;
DO $$
BEGIN
 IF has_table_privilege('anon','public.source_runs','SELECT') THEN RAISE EXCEPTION 'anon can read raw runs'; END IF;
 IF has_table_privilege('anon','public.source_locks','SELECT') THEN RAISE EXCEPTION 'anon can read locks'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE tablename IN('source_runs','source_locks') AND qual='true') THEN RAISE EXCEPTION 'unrestricted source policy remains'; END IF;
 IF has_table_privilege('anon','public.inquiries','INSERT') OR has_table_privilege('authenticated','public.inquiries','INSERT') THEN RAISE EXCEPTION 'inquiry limit bypass'; END IF;
 IF has_function_privilege('anon','public.claim_source_refresh(text,boolean,integer,integer,integer)','EXECUTE') OR has_function_privilege('authenticated','public.claim_source_refresh(text,boolean,integer,integer,integer)','EXECUTE') THEN RAISE EXCEPTION 'source reservation is not service-only'; END IF;
 IF has_function_privilege('authenticated','public.reserve_brief_claim(uuid,integer,integer)','EXECUTE') THEN RAISE EXCEPTION 'user may supply own allowance'; END IF;
END $$;
DO $$
DECLARE v jsonb;
BEGIN
 v:=public.public_source_summary();
 IF jsonb_typeof(v->'runs') <> 'array' THEN RAISE EXCEPTION 'public summary missing'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v->'runs') r WHERE r ? 'next_allowed_at' OR r ? 'consecutive_failures' OR r ? 'attempts') THEN RAISE EXCEPTION 'operational data leaked'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v->'runs') r WHERE r->>'problem' IS NOT NULL AND r->>'problem' <> 'The latest refresh did not return usable data. Cached readings remain available with their original dates.') THEN RAISE EXCEPTION 'raw error leaked'; END IF;
END $$;
DO $$
DECLARE v jsonb; i integer; u uuid:=gen_random_uuid(); unlimited_u uuid:=gen_random_uuid(); k text:=encode(sha256(gen_random_uuid()::text::bytea),'hex');
BEGIN
 FOR i IN 1..5 LOOP
  v:=public.claim_request_window(k,5,3600);
  IF v->>'ok'<>'true' THEN RAISE EXCEPTION 'allowed request denied'; END IF;
 END LOOP;
 v:=public.claim_request_window(k,5,3600);
 IF v->>'ok'<>'false' OR (v->>'waitSeconds')::integer<1 THEN RAISE EXCEPTION 'sixth request not blocked'; END IF;
 FOR i IN 1..5 LOOP INSERT INTO public.brief_claims(user_id,at) VALUES(u,now()-interval '1 minute'); END LOOP;
 v:=public.reserve_brief_claim(u,5,20000);
 IF v->>'reason'<>'daily_limit' THEN RAISE EXCEPTION 'free five-per-day limit bypassed'; END IF;
 FOR i IN 1..201 LOOP INSERT INTO public.brief_claims(user_id,at) VALUES(unlimited_u,now()-interval '1 minute'); END LOOP;
 v:=public.reserve_brief_claim(unlimited_u,0,20000);
 IF v->>'ok'<>'true' THEN RAISE EXCEPTION 'unlimited plan capped at 200'; END IF;
 v:=public.reserve_brief_claim(unlimited_u,0,20000);
 IF v->>'reason'<>'interval' THEN RAISE EXCEPTION 'unlimited interval bypassed'; END IF;
END $$;
ROLLBACK;