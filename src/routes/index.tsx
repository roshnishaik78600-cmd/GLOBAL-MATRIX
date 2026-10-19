import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.lovable.app" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.lovable.app" },
      { title: "GlobalMatrix — See the World. Understand the Impact." },
      {
        name: "description",
        content:
          "See what changed, trace the impact. GlobalMatrix connects geopolitical events to the countries, flows, infrastructure, industries and businesses they affect.",
      },
      {
        property: "og:title",
        content: "GlobalMatrix — See the World. Understand the Impact.",
      },
      {
        property: "og:description",
        content:
          "Global geopolitical and supply-chain exposure intelligence, built on evidence-backed events and exposure data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
