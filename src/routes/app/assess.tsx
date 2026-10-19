import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SCENARIOS } from "@/lib/intel/scenarios";
import { allAssessments } from "@/lib/intel/engine";
import { INDUSTRIES } from "@/lib/intel/industries";
import { NODES } from "@/lib/intel/nodes";
import { matchDependencies, type DeclaredDependency } from "@/lib/intel/profile";
import { CHANNEL_LABEL } from "@/lib/intel/types";
import { profileSchema } from "@/lib/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/app/assess")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/assess" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/assess" },
      { name: "robots", content: "noindex" },
      { title: "Business Exposure Assessment — GlobalMatrix" },
      {
        name: "description",
        content:
          "Declare your industry and sourcing countries to see which tracked disruptions reach your business.",
      },
      { property: "og:title", content: "Business Exposure Assessment — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "A personalised exposure view built only from relationships the model actually tracks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assess,
});

const PLACES = NODES.filter((n) => n.kind === "economy" || n.kind === "bloc").sort((a, b) =>
  a.label.localeCompare(b.label),
);
const CHOKE = NODES.filter((n) => n.kind === "chokepoint" || n.kind === "corridor");
const empty = {
  company_name: "",
  industry_id: "",
  home_node: "",
  sourcing_nodes: [] as string[],
  products: "",
  concerns: "",
};
const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function Assess() {
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm({
            company_name: data.company_name ?? "",
            industry_id: data.industry_id,
            home_node: data.home_node,
            sourcing_nodes: data.sourcing_nodes,
            products: data.products ?? "",
            concerns: data.concerns ?? "",
          });
        setLoaded(true);
      });
  }, [user]);

  const matches = useMemo(() => {
    if (!form.industry_id && !form.home_node) return null;
    const deps: DeclaredDependency[] = [
      ...(form.industry_id ? [{ kind: "industry" as const, refId: form.industry_id }] : []),
      ...[form.home_node, ...form.sourcing_nodes]
        .filter(Boolean)
        .map((refId) => ({ kind: "node" as const, refId })),
    ];
    return matchDependencies(deps, allAssessments(SCENARIOS));
  }, [form.industry_id, form.home_node, form.sourcing_nodes]);

  const toggle = (id: string) =>
    setForm((f) => ({
      ...f,
      sourcing_nodes: f.sourcing_nodes.includes(id)
        ? f.sourcing_nodes.filter((x) => x !== id)
        : [...f.sourcing_nodes, id].slice(0, 20),
    }));

  async function save() {
    if (!user) return;
    const p = profileSchema.safeParse({ ...form, company_name: form.company_name || undefined });
    if (!p.success) {
      toast.error(p.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("business_profiles").upsert(
      {
        ...p.data,
        company_name: p.data.company_name ?? null,
        products: p.data.products ?? null,
        concerns: p.data.concerns ?? null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) toast.error("Could not save your profile. Please try again.");
    else toast.success("Profile saved");
  }

  return (
    <div className="gm-account-page mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-semibold text-foreground">Business exposure assessment</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Tell us what you depend on. We only show links the model actually tracks — nothing is
        inferred about your company that you haven't declared.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6 border-t border-border pt-6">
          <div className="space-y-1.5">
            <Label>Company name (optional)</Label>
            <Input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <select
              className={sel}
              value={form.industry_id}
              onChange={(e) => setForm({ ...form, industry_id: e.target.value })}
            >
              <option value="">Choose…</option>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Country of operation</Label>
            <select
              className={sel}
              value={form.home_node}
              onChange={(e) => setForm({ ...form, home_node: e.target.value })}
            >
              <option value="">Choose…</option>
              {PLACES.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Sourcing countries & shipping routes</Label>
            <div className="flex flex-wrap gap-1.5">
              {[...PLACES, ...CHOKE]
                .filter((n) => n.id !== form.home_node)
                .map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggle(n.id)}
                    aria-pressed={form.sourcing_nodes.includes(n.id)}
                    className={`rounded border px-2 py-1 text-xs ${form.sourcing_nodes.includes(n.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {n.label}
                  </button>
                ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Key products, commodities or components</Label>
            <Textarea
              rows={2}
              value={form.products}
              onChange={(e) => setForm({ ...form, products: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Concerns & monitoring priorities</Label>
            <Textarea
              rows={2}
              value={form.concerns}
              onChange={(e) => setForm({ ...form, concerns: e.target.value })}
            />
          </div>
          {isLoading ? null : user ? (
            <Button onClick={save} disabled={saving || (!loaded && !!user)}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to save this profile and revisit it.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Products and concerns are stored for your reference and for tailored reports; the model
            does not score free text.
          </p>
        </div>

        <div>
          {!matches ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Choose an industry or country to see your exposure.
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-sm text-muted-foreground">
              No tracked event currently reaches what you declared. That is a finding, not a
              guarantee — coverage is limited to the corpus.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <div
                  key={`${m.kind}:${m.refId}`}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-foreground">
                      {m.label}{" "}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {m.kind === "industry"
                          ? "your industry"
                          : m.refId === form.home_node
                            ? "where you operate"
                            : "you source from"}
                      </span>
                    </p>
                    <span className="font-mono text-sm text-foreground">
                      {Math.round(m.load * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Modelled exposure from {m.eventCount} event{m.eventCount === 1 ? "" : "s"} ·{" "}
                    {m.kind === "node"
                      ? "direct pathway in the event data"
                      : "inferred via the industry's producers, inputs and routes"}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {m.topEvents.slice(0, 4).map((e) => (
                      <li key={e.eventId} className="flex justify-between gap-3 text-sm">
                        <Link
                          to="/app/report/$eventId"
                          params={{ eventId: e.eventId }}
                          className="truncate text-foreground hover:text-primary"
                        >
                          {e.title}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {CHANNEL_LABEL[e.channel]} · {e.lagDays[0]}–{e.lagDays[1]}d
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
