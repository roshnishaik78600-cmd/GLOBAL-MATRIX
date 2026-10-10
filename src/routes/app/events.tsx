import { createFileRoute } from "@tanstack/react-router";
import Detection from "@/pages/Detection";

export const Route = createFileRoute("/app/events")({
  head: () => ({
    meta: [
      { title: "Event Detection — GlobalMatrix" },
      {
        name: "description",
        content: "Newly detected geopolitical and supply-chain events, ranked by verification and potential impact.",
      },
      { property: "og:title", content: "Event Detection — GlobalMatrix" },
      {
        property: "og:description",
        content: "Newly detected geopolitical and supply-chain events, ranked by verification and potential impact.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detection,
});
