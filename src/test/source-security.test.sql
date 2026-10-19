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
ROLLBACK;