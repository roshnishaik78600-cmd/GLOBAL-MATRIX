import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Shell } from "@/components/viz/Shell";

export const Route = createFileRoute("/app")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app" },
      { title: "GlobalMatrix — Intelligence Workspace" },
      {
        name: "description",
        content:
          "Explore geopolitical events, modelled exposure and attributed evidence in the GlobalMatrix workspace.",
      },
      { property: "og:title", content: "GlobalMatrix — Intelligence Workspace" },
      {
        property: "og:description",
        content: "Connected events, country exposure and evidence-led investigation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
