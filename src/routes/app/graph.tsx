import { createFileRoute } from "@tanstack/react-router";
import GraphExplorerPage from "@/pages/GraphExplorerPage";

export const Route = createFileRoute("/app/graph")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/graph" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/graph" },
      { title: "Graph Explorer — GlobalMatrix" },
      {
        name: "description",
        content:
          "Explore how events propagate through the exposure graph of countries, industries and businesses.",
      },
      { property: "og:title", content: "Graph Explorer — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Explore how events propagate through the exposure graph of countries, industries and businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GraphExplorerPage,
});
