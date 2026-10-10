import { createFileRoute } from "@tanstack/react-router";
import Supply from "@/pages/Supply";

export const Route = createFileRoute("/app/supply")({
  head: () => ({
    meta: [
      { title: "Supply Chain Exposure — GlobalMatrix" },
      {
        name: "description",
        content: "Trace supply-chain exposure across industries, routes and critical infrastructure.",
      },
      { property: "og:title", content: "Supply Chain Exposure — GlobalMatrix" },
      {
        property: "og:description",
        content: "Trace supply-chain exposure across industries, routes and critical infrastructure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Supply,
});
