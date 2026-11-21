import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminConsole, adminUpdateInquiry } from "@/lib/admin.functions";

type Data = Awaited<ReturnType<typeof adminConsole>>;
type Inquiry = Data["inquiries"][number];
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

export function useAdminConsole() {
  const load = useServerFn(adminConsole);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const refresh = useCallback(() => {
    load()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, [load]);
  useEffect(refresh, [refresh]);
  return { data, error, refresh };
}

function State({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  return error ? (
    <p role="alert" className="text-sm text-destructive">
      Could not load.{" "}
      <button className="underline" onClick={onRetry}>
        Retry
      </button>
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">Loading…</p>
  );
}

const input = "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";

export function CustomersPanel({ c }: { c: ReturnType<typeof useAdminConsole> }) {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const rows = useMemo(
    () =>
      (c.data?.customers ?? [])
        .filter((u) => u.email.toLowerCase().includes(q.toLowerCase()))
        .filter((u) => plan === "all" || u.plan === plan)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [c.data, q, plan],
  );
  if (!c.data) return <State error={c.error} onRetry={c.refresh} />;
  const all = c.data.customers;
  const week = Date.now() - 7 * 864e5;
  return (
    <div className="space-y-5">
      <div className="grid gap-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["Registered users", all.length],
            ["New in 7 days", all.filter((u) => Date.parse(u.created_at) > week).length],
            ["Free", all.filter((u) => u.plan === "free").length],
            ["Analyst", all.filter((u) => u.plan === "analyst").length],
            ["Business", all.filter((u) => u.plan === "business").length],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="border-l border-border pl-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Search by email"
          placeholder="Search email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={input}
        />
        <select
          aria-label="Plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className={input}
        >
          {["all", "free", "analyst", "business"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {[
                "Email",
                "Account ID",
                "Joined",
                "Last sign-in",
                "Email confirmed",
                "Plan",
                "Status",
                "Renews/expires",
              ].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  No customers match.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border text-foreground">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{u.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">{day(u.created_at)}</td>
                  <td className="px-3 py-2">{day(u.last_sign_in_at)}</td>
                  <td className="px-3 py-2">{u.confirmed ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 capitalize">{u.plan}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2">{day(u.expires_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InquiryRow({ i, onSaved }: { i: Inquiry; onSaved: () => void }) {
  const save = useServerFn(adminUpdateInquiry);
  const [status, setStatus] = useState(i.status);
  const [priority, setPriority] = useState(i.priority);
  const [note, setNote] = useState(i.admin_note ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <li className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {i.name}{" "}
          <span className="font-normal text-muted-foreground">
            · {i.email}
            {i.company ? ` · ${i.company}` : ""}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {i.kind} · {new Date(i.created_at).toLocaleString()}
        </p>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{i.message}</p>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={input}
        >
          {["new", "open", "in_progress", "resolved"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={input}
        >
          {["low", "normal", "high"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          aria-label="Internal note"
          placeholder="Internal note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${input} min-w-56 flex-1`}
        />
        <button
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          onClick={() =>
            save({ data: { id: i.id, status, priority, note } })
              .then(() => {
                setMsg("Saved");
                onSaved();
              })
              .catch((e) => setMsg(e instanceof Error ? e.message : "Failed"))
          }
        >
          Save
        </button>
        {msg && (
          <span role="status" className="self-center text-xs text-muted-foreground">
            {msg}
          </span>
        )}
      </div>
    </li>
  );
}

export function SupportPanel({ c }: { c: ReturnType<typeof useAdminConsole> }) {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  if (!c.data) return <State error={c.error} onRetry={c.refresh} />;
  const rows = c.data.inquiries
    .filter((i) => status === "all" || i.status === status)
    .filter((i) => `${i.name} ${i.email} ${i.message}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Messages from the website's contact and request forms. Email notifications are not connected
        yet.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Search messages"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={input}
        />
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={input}
        >
          {["all", "new", "open", "in_progress", "resolved"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((i) => (
            <InquiryRow key={i.id} i={i} onSaved={c.refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminActivityPanel({ c }: { c: ReturnType<typeof useAdminConsole> }) {
  if (!c.data) return <State error={c.error} onRetry={c.refresh} />;
  if (c.data.audit.length === 0)
    return <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-xs">
      {c.data.audit.map((a) => (
        <li key={a.id} className="flex flex-wrap gap-3 px-3 py-2 text-foreground">
          <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
          <span className="font-medium">{a.action}</span>
          <span>
            {a.target_type} {a.target_id?.slice(0, 8)}
          </span>
          <span className="text-muted-foreground">{a.detail}</span>
        </li>
      ))}
    </ul>
  );
}
