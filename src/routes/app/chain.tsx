import { createFileRoute } from "@tanstack/react-router";
import ChainPage from "@/pages/Chain";

export const Route = createFileRoute("/app/chain")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/chain" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/chain" },
      { title: "Propagation Chain — GlobalMatrix" },
      {
        name: "description",
        content: "Trace how a single event propagates from geography to impact to exposure.",
      },
      { property: "og:title", content: "Propagation Chain — GlobalMatrix" },
      {
        property: "og:description",
        content: "Trace how a single event propagates from geography to impact to exposure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChainPage,
});
