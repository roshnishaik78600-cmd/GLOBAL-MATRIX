CREATE OR REPLACE FUNCTION public.reserve_brief_claim(p_user_id uuid, p_daily_limit integer, p_interval_ms integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now timestamptz := clock_timestamp(); v_last timestamptz; v_count integer; v_wait integer;
BEGIN
  IF p_user_id IS NULL OR p_daily_limit < 1 OR p_interval_ms < 1 THEN RAISE EXCEPTION 'Invalid reservation'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  v_now := clock_timestamp();
  SELECT max(at) INTO v_last FROM public.brief_claims WHERE user_id = p_user_id;
  v_wait := ceil(p_interval_ms / 1000.0 - extract(epoch FROM (v_now - v_last)));
  IF v_wait > 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'interval', 'wait_seconds', v_wait); END IF;
  SELECT count(*) INTO v_count FROM public.brief_claims WHERE user_id = p_user_id AND at >= (date_trunc('day', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
  IF v_count >= p_daily_limit THEN RETURN jsonb_build_object('ok', false, 'reason', 'daily_limit'); END IF;
  INSERT INTO public.brief_claims(user_id, at) VALUES (p_user_id, v_now);
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_brief_claim(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_brief_claim(uuid, integer, integer) TO service_role;