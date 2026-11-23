import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/billing/billing.functions";

const STATUSES = ["new", "open", "in_progress", "resolved"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

/** Customers, support inbox and admin activity — MFA admins only. No passwords or tokens leave the server. */
export const adminConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users }, { data: subs }, { data: inquiries }, { data: audit }] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
        supabaseAdmin.from("subscriptions").select("user_id,plan,status,expires_at"),
        supabaseAdmin
          .from("inquiries")
          .select("id,kind,name,email,company,message,status,priority,admin_note,created_at")
          .order("created_at", { ascending: false })
          .limit(300),
        supabaseAdmin
          .from("admin_audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
    const subBy = new Map((subs ?? []).map((s) => [s.user_id, s]));
    const customers = (users?.users ?? []).map((u) => {
      const s = subBy.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        plan:
          s && s.status === "active" && (!s.expires_at || Date.parse(s.expires_at) > Date.now())
            ? s.plan
            : "free",
        status: s?.status ?? "none",
        expires_at: s?.expires_at ?? null,
      };
    });
    return { customers, inquiries: inquiries ?? [], audit: audit ?? [] };
  });

export const adminUpdateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => {
    const i = input as { id?: unknown; status?: unknown; priority?: unknown; note?: unknown };
    if (typeof i?.id !== "string" || !/^[0-9a-f-]{36}$/.test(i.id)) throw new Error("Invalid id");
    if (!STATUSES.includes(i.status as never)) throw new Error("Invalid status");
    if (!PRIORITIES.includes(i.priority as never)) throw new Error("Invalid priority");
    if (typeof i.note !== "string" || i.note.length > 2000) throw new Error("Note too long");
    return {
      id: i.id,
      status: i.status as string,
      priority: i.priority as string,
      note: i.note.trim(),
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("inquiries")
      .update({
        status: data.status,
        priority: data.priority,
        admin_note: data.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not save");
    await supabaseAdmin.from("admin_audit_logs").insert({
      actor_id: context.userId,
      action: "support.update",
      target_type: "inquiry",
      target_id: data.id,
      detail: `status=${data.status}; priority=${data.priority}`,
    });
    return { ok: true };
  });
