import { useState } from "react";
import { ArrowUpRight, Globe2, Network, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-shim";
import { useQuery } from "@/lib/backend/shim";
import { api } from "@/lib/backend/api";
import { buildStages } from "@/lib/intel/chain";
import { Skeleton } from "@/components/viz/core";

/** A real slice of the existing demonstration corpus, not an invented preview. */
export function EventPreview() {
  const feed = useQuery(api.intel.detectionFeed, {});
  const [eventId, setEventId] = useState<string | null>(null);
  const selected = feed?.rows.find((row) => row.id === eventId) ?? feed?.rows[0];
  const chain = useQuery(api.intel.eventChain, selected ? { eventId: selected.id } : "skip");
  const stages = chain ? buildStages(chain) : [];
  const countries = stages.find((stage) => stage.id === "country");
  const industry = stages.find((stage) => stage.id === "industry");

  return (
    <div className="gm-event-preview" aria-label="Event exposure preview">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <span className="font-mono text-xs text-primary">DEMONSTRATION / NOT LIVE NEWS</span>
        <Link to="/methodology" className="text-xs text-muted-foreground hover:text-foreground">
          Modelled exposure · methodology ↗
        </Link>
      </div>
      {!feed ? (
        <Skeleton className="mt-4 h-28 w-full" />
      ) : !selected ? (
        <p className="py-6 text-sm text-muted-foreground">No events are available to explore.</p>
      ) : (
        <>
          <label htmlFor="hero-event" className="sr-only">
            Explore an event
          </label>
          <select
            id="hero-event"
            value={selected.id}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-4 w-full border-0 bg-background py-2 text-sm font-medium text-foreground"
          >
            {feed.rows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
          <div className="gm-preview-path" aria-live="polite">
            <div>
              <ScanLine className="size-4 text-primary" />
              <small>Global event</small>
              <strong>{selected.reference}</strong>
            </div>
            <div>
              <Globe2 className="size-4 text-primary" />
              <small>Country exposure</small>
              <strong>
                {countries?.rows
                  .slice(0, 2)
                  .map((row) => row.label)
                  .join(" · ") || (chain ? "Unmeasured" : <Skeleton className="h-4 w-24" />)}
              </strong>
            </div>
            <div>
              <Network className="size-4 text-primary" />
              <small>Industry impact</small>
              <strong>{industry?.rows[0]?.label || (chain ? "Unmeasured" : <Skeleton className="h-4 w-24" />)}</strong>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Supplier dependencies remain unmeasured.
            </p>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link to={`/app/graph?event=${selected.id}`}>
                Trace this event <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
