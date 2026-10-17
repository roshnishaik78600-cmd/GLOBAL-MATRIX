import { createFileRoute } from "@tanstack/react-router";
import IndustryProfile from "@/pages/IndustryProfile";

export const Route = createFileRoute("/app/industry/$industryId")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Industry Profile — GlobalMatrix" },
      {
        name: "description",
        content:
          "Exposure profile for a single industry: events, countries and supply-chain dependencies.",
      },
      { property: "og:title", content: "Industry Profile — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Exposure profile for a single industry: events, countries and supply-chain dependencies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryProfile,
});
