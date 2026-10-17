import { createFileRoute } from "@tanstack/react-router";
import Countries from "@/pages/Countries";

export const Route = createFileRoute("/app/countries")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app/app/countries" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app/app/countries" },
      { title: "Countries — GlobalMatrix" },
      {
        name: "description",
        content:
          "Browse every country tracked by GlobalMatrix, with exposure scores and recent events.",
      },
      { property: "og:title", content: "Countries — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Browse every country tracked by GlobalMatrix, with exposure scores and recent events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Countries,
});
