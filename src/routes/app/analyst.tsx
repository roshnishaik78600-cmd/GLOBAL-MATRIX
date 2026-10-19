import { createFileRoute } from "@tanstack/react-router";
import Analyst from "@/pages/Analyst";

export const Route = createFileRoute("/app/analyst")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/analyst" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/analyst" },
      { name: "robots", content: "noindex" },
      { title: "Analyst — GlobalMatrix" },
      {
        name: "description",
        content:
          "Ask questions of the GlobalMatrix dataset and get evidence-backed answers on events and exposure.",
      },
      { property: "og:title", content: "Analyst — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Ask questions of the GlobalMatrix dataset and get evidence-backed answers on events and exposure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analyst,
});
