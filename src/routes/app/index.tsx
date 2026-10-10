import { createFileRoute } from "@tanstack/react-router";
import Overview from "@/pages/Overview";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
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
