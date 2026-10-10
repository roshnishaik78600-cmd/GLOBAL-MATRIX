CREATE OR REPLACE FUNCTION public.is_mfa_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt()->>'aal','') = 'aal2' AND public.has_role(auth.uid(), 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.is_mfa_admin() TO authenticated;

DROP POLICY IF EXISTS "own or admin read orders" ON public.orders;
CREATE POLICY "own or admin read orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_mfa_admin());
DROP POLICY IF EXISTS "own or admin read subscriptions" ON public.subscriptions;
CREATE POLICY "own or admin read subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_mfa_admin());
DROP POLICY IF EXISTS "own or admin read payment events" ON public.payment_events;
CREATE POLICY "own or admin read payment events" ON public.payment_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_mfa_admin());
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_mfa_admin());