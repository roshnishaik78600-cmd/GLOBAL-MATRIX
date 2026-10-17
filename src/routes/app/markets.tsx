import { createFileRoute } from "@tanstack/react-router";
import Markets from "@/pages/Markets";

export const Route = createFileRoute("/app/markets")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/markets" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/markets" },
      { title: "Markets — GlobalMatrix" },
      {
        name: "description",
        content: "Market-moving signals linked back to the geopolitical events behind them.",
      },
      { property: "og:title", content: "Markets — GlobalMatrix" },
      {
        property: "og:description",
        content: "Market-moving signals linked back to the geopolitical events behind them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Markets,
});
