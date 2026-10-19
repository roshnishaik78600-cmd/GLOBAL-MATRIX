import { createFileRoute } from "@tanstack/react-router";
import Detection from "@/pages/Detection";

export const Route = createFileRoute("/app/events")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/events" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/events" },
      { title: "Event Detection — GlobalMatrix" },
      {
        name: "description",
        content:
          "Newly detected geopolitical and supply-chain events, ranked by verification and potential impact.",
      },
      { property: "og:title", content: "Event Detection — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Newly detected geopolitical and supply-chain events, ranked by verification and potential impact.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detection,
});
