import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/viz/Shell";
import { FocusProvider } from "@/lib/focus";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <FocusProvider>
      <Shell>
        <Outlet />
      </Shell>
    </FocusProvider>
  );
}
