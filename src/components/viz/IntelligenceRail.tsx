import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, ArrowUpRight, Network } from "lucide-react";
import { NAV_GROUPS } from "@/components/viz/navigation";
import { NavLink, Link } from "@/lib/router-shim";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IntelligenceRail() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={cn("gm-intelligence-rail hidden shrink-0 flex-col border-r border-border bg-sidebar md:flex", collapsed ? "w-16" : "w-52")} aria-label="Product navigation">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        {!collapsed && <span className="text-xs font-medium text-muted-foreground">Workspace</span>}
        <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map(group => <div key={group.id} className="mb-5">
          {!collapsed && <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>}
          {group.items.map(item => <NavLink key={item.to} to={item.to} end={item.end} title={item.unavailable ? `${item.label}: ${item.unavailable}` : item.label} className={({isActive}) => cn("gm-rail-link relative mb-0.5 flex h-9 items-center gap-3 rounded-md px-3 text-xs transition-colors", isActive ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", item.unavailable && "opacity-60")}>
            <item.icon className="size-4 shrink-0" />{!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>)}
        </div>)}
      </nav>
      {!collapsed && <div className="border-t border-border p-4"><Network className="mb-3 size-5 text-primary" /><p className="text-sm font-medium">Follow the connections.</p><Link to="/pricing" className="mt-2 flex items-center justify-between text-xs text-muted-foreground">Plans & allowances <ArrowUpRight className="size-4" /></Link></div>}
    </aside>
  );
}