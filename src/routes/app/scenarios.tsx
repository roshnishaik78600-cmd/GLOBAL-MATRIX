import { createFileRoute } from "@tanstack/react-router";
import Scenarios from "@/pages/Scenarios";

export const Route = createFileRoute("/app/scenarios")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/scenarios" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/scenarios" },
      { title: "Scenarios — GlobalMatrix" },
      {
        name: "description",
        content:
          "Explore what-if scenarios for geopolitical and supply-chain shocks, never presented as predictions.",
      },
      { property: "og:title", content: "Scenarios — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Explore what-if scenarios for geopolitical and supply-chain shocks, never presented as predictions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Scenarios,
});
