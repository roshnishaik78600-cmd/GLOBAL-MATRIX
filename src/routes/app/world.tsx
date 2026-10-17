import { createFileRoute } from "@tanstack/react-router";
import World from "@/pages/World";

export const Route = createFileRoute("/app/world")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/world" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/world" },
      { title: "World Map — GlobalMatrix" },
      {
        name: "description",
        content:
          "An interactive world map of geopolitical events and exposure, country by country.",
      },
      { property: "og:title", content: "World Map — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "An interactive world map of geopolitical events and exposure, country by country.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: World,
});
