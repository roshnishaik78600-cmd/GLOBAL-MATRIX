import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PERSONAL_TABLES = [
  "watchlist",
  "annotations",
  "briefs",
  "business_profiles",
  "exposure_deps",
  "brief_claims",
] as const;

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { confirm: string }) => {
    if (input?.confirm !== "DELETE") throw new Error("Type DELETE to confirm.");
    return input;
  })
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error("Could not check your account. Try again.");
    if (isAdmin) throw new Error("Administrator accounts cannot be deleted here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const table of PERSONAL_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (error) throw new Error("Could not remove your saved data. Nothing else was deleted.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error)
      throw new Error(
        "Your saved data was removed, but the sign-in could not be deleted. Try again.",
      );
    return { ok: true };
  });
