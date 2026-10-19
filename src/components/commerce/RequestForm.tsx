import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inquirySchema, type InquiryKind } from "@/lib/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const KIND_LABEL: Record<InquiryKind, string> = {
  sample: "Request a sample report",
  report: "Request a one-time report",
  pilot: "Request a paid pilot",
  contact: "General question",
};

export function RequestForm({ defaultKind = "sample" }: { defaultKind?: InquiryKind }) {
  const [kind, setKind] = useState<InquiryKind>(defaultKind);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [problem, setProblem] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.website) return; // honeypot
    const parsed = inquirySchema.safeParse({ kind, ...form, company: form.company || undefined });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");
    const { error } = await supabase
      .from("inquiries")
      .insert({ ...parsed.data, company: parsed.data.company ?? null });
    if (error) {
      setState("error");
      setProblem(
        error.code === "23505"
          ? "We already received a request of this type from this email today. We'll be in touch."
          : "Your request could not be sent. Please try again in a moment.",
      );
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Request received.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your inquiry has been saved for review. A response time has not been confirmed. No payment
          has been taken.
        </p>
      </div>
    );
  }

  const field = (key: "name" | "email" | "company", label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`rq-${key}`}>{label}</Label>
      <Input
        id={`rq-${key}`}
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-border bg-card p-6"
      noValidate
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Request type">
        {(Object.keys(KIND_LABEL) as InquiryKind[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${kind === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Name")}
        {field("email", "Work email", "email")}
      </div>
      {field("company", "Company (optional)")}
      <div className="space-y-1.5">
        <Label htmlFor="rq-message">What do you need to understand?</Label>
        <Textarea
          id="rq-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="e.g. We import electronic components from Taiwan and South Korea via Malacca…"
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
      </div>
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      {state === "error" && <p className="text-sm text-destructive">{problem}</p>}
      <Button type="submit" disabled={state === "sending"} className="w-full sm:w-auto">
        {state === "sending" ? "Sending…" : KIND_LABEL[kind]}
      </Button>
    </form>
  );
}
