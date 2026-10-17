import { createFileRoute } from "@tanstack/react-router";
import RiskBoard from "@/pages/RiskBoard";

export const Route = createFileRoute("/app/risk")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/risk" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/risk" },
      { title: "Risk Board — GlobalMatrix" },
      {
        name: "description",
        content:
          "A ranked board of emerging geopolitical and supply-chain risks across countries and sectors.",
      },
      { property: "og:title", content: "Risk Board — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "A ranked board of emerging geopolitical and supply-chain risks across countries and sectors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RiskBoard,
});
