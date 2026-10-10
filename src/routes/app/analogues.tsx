import { createFileRoute } from "@tanstack/react-router";
import NotAvailable from "@/pages/NotAvailable";

export const Route = createFileRoute("/app/analogues")({
  head: () => ({
    meta: [
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
