import { createFileRoute } from "@tanstack/react-router";
import Trade from "@/pages/Trade";

export const Route = createFileRoute("/app/trade")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/trade" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/trade" },
      { title: "Trade Flows — GlobalMatrix" },
      {
        name: "description",
        content: "Global trade flows and how current events are reshaping them.",
      },
      { property: "og:title", content: "Trade Flows — GlobalMatrix" },
      {
        property: "og:description",
        content: "Global trade flows and how current events are reshaping them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Trade,
});
