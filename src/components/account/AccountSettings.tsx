import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSettings({ email }: { email: string }) {
  const del = useServerFn(deleteMyAccount);
  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    if (pw.length < 8) return setPwMsg("Use at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    setPw("");
    setPwMsg(error ? error.message : "Password updated.");
  };

  const remove = async () => {
    setBusy(true);
    setDelMsg(null);
    try {
      await del({ data: { confirm } });
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch (e) {
      setDelMsg(e instanceof Error ? e.message : "Could not delete the account.");
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-lg font-semibold">Account settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <Button onClick={changePassword} disabled={busy || !pw}>
            Change password
          </Button>
          {pwMsg && (
            <p className="text-sm text-muted-foreground" role="status">
              {pwMsg}
            </p>
          )}
        </div>
        <div className="space-y-3 rounded-md border border-destructive/40 p-4">
          <h3 className="font-medium text-destructive">Delete account</h3>
          <p className="text-sm text-muted-foreground">
            Removes your sign-in, watchlist, notes, saved briefs and business profile. Order and
            payment records are kept for accounting. This cannot be undone.
          </p>
          <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button variant="destructive" onClick={remove} disabled={busy || confirm !== "DELETE"}>
            Delete my account
          </Button>
          {delMsg && (
            <p className="text-sm text-destructive" role="alert">
              {delMsg}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
