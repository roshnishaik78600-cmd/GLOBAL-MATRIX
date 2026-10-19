import { createFileRoute } from "@tanstack/react-router";
import Industries from "@/pages/Industries";

export const Route = createFileRoute("/app/industries")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/industries" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/industries" },
      { title: "Industries — GlobalMatrix" },
      {
        name: "description",
        content:
          "Browse every industry tracked by GlobalMatrix, with exposure to current geopolitical events.",
      },
      { property: "og:title", content: "Industries — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Browse every industry tracked by GlobalMatrix, with exposure to current geopolitical events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Industries,
});
