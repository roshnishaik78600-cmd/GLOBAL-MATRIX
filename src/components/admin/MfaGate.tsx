import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2 } from "lucide-react";

type Stage =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "challenge"; factorId: string }
  | { kind: "ok" }
  | { kind: "error"; message: string };

/** Requires an authenticator-app code (TOTP) before rendering admin content. */
export function MfaGate({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") return setStage({ kind: "ok" });
        const { data: f, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verified = f.totp.find((x) => x.status === "verified");
        if (verified) return setStage({ kind: "challenge", factorId: verified.id });
        // Clear abandoned enrollments, then start a fresh one.
        for (const x of f.all.filter((x) => x.status === "unverified"))
          await supabase.auth.mfa.unenroll({ factorId: x.id });
        const { data: e, error: ee } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `GlobalMatrix admin ${Date.now()}`,
        });
        if (ee) throw ee;
        setStage({ kind: "enroll", factorId: e.id, qr: e.totp.qr_code, secret: e.totp.secret });
      } catch (e) {
        setStage({ kind: "error", message: e instanceof Error ? e.message : "Could not start MFA" });
      }
    })();
  }, []);

  async function verify(factorId: string) {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setErr("That code didn't work. Check your authenticator app and try again.");
    setStage({ kind: "ok" });
  }

  if (stage.kind === "ok") return <>{children}</>;
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-sm border-y border-border py-8">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="mt-3 text-xl font-semibold text-foreground">Two-step verification</h1>
        {stage.kind === "loading" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking…
          </p>
        )}
        {stage.kind === "error" && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {stage.message}
          </p>
        )}
        {stage.kind === "enroll" && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Scan with Google Authenticator, Authy or 1Password, then enter the 6-digit code.
            </p>
            <div className="mt-4 w-fit rounded-md bg-qr-paper p-3">
              <img src={stage.qr} alt="Authenticator setup QR code" className="size-40" />
            </div>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{stage.secret}</p>
          </>
        )}
        {stage.kind === "challenge" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        )}
        {(stage.kind === "enroll" || stage.kind === "challenge") && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              verify(stage.factorId);
            }}
          >
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-label="6-digit code"
              placeholder="123456"
            />
            {err && (
              <p role="alert" className="text-sm text-destructive">
                {err}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="animate-spin" />} Verify
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
