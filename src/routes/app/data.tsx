import { createFileRoute } from "@tanstack/react-router";
import DataSources from "@/pages/DataSources";

export const Route = createFileRoute("/app/data")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/data" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/data" },
      { title: "Data Sources — GlobalMatrix" },
      {
        name: "description",
        content:
          "The sources, feeds and verification standards behind every figure in GlobalMatrix.",
      },
      { property: "og:title", content: "Data Sources — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "The sources, feeds and verification standards behind every figure in GlobalMatrix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataSources,
});
