ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_logs_created_idx ON public.admin_audit_logs(created_at DESC);
GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mfa admins read audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.is_mfa_admin());