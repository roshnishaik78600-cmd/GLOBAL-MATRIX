import { createFileRoute } from "@tanstack/react-router";
import Trade from "@/pages/Trade";

export const Route = createFileRoute("/app/trade")({
  head: () => ({
    meta: [
      { title: "Trade Flows — GlobalMatrix" },
      {
        name: "description",
        content: "Global trade flows and how current events are reshaping them.",
      },
      { property: "og:title", content: "Trade Flows — GlobalMatrix" },
      {
        property: "og:description",
        content: "Global trade flows and how current events are reshaping them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Trade,
});
