import { createFileRoute } from "@tanstack/react-router";
import Overview from "@/pages/Overview";

export const Route = createFileRoute("/app/")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app" },
      { title: "Overview — GlobalMatrix Console" },
      {
        name: "description",
        content:
          "A real-time overview of global events, exposure shifts and emerging risks across countries and industries.",
      },
      { property: "og:title", content: "Overview — GlobalMatrix Console" },
      {
        property: "og:description",
        content:
          "A real-time overview of global events, exposure shifts and emerging risks across countries and industries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});
