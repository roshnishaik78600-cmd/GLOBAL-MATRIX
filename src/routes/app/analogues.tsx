import { createFileRoute } from "@tanstack/react-router";
import NotAvailable from "@/pages/NotAvailable";

export const Route = createFileRoute("/app/analogues")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/analogues" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/analogues" },
      { title: "Historical Analogues — GlobalMatrix" },
      {
        name: "description",
        content: "Historical analogues for current events in GlobalMatrix.",
      },
      { property: "og:title", content: "Historical Analogues — GlobalMatrix" },
      {
        property: "og:description",
        content: "Historical analogues for current events in GlobalMatrix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotAvailable,
});
