import { createFileRoute } from "@tanstack/react-router";
import Methodology from "@/pages/Methodology";

export const Route = createFileRoute("/methodology")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/methodology" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/methodology" },
      { title: "Methodology — GlobalMatrix" },
      {
        name: "description",
        content:
          "How GlobalMatrix sources, verifies and scores geopolitical events, exposure figures and risk signals.",
      },
      { property: "og:title", content: "Methodology — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "How GlobalMatrix sources, verifies and scores geopolitical events, exposure figures and risk signals.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Methodology,
});
