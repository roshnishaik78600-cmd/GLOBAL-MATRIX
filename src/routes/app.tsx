import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/viz/Shell";

export const Route = createFileRoute("/app")({
  staticData: { sitemap: false },
  component: AppLayout,
});

function AppLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
