import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobalMatrix — Global Risk. Connected. Understood." },
      {
        name: "description",
        content:
          "See what changed, trace the impact. GlobalMatrix connects geopolitical events to the countries, flows, infrastructure, industries and businesses they affect.",
      },
      {
        property: "og:title",
        content: "GlobalMatrix — Global Risk. Connected. Understood.",
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
