import { createFileRoute } from "@tanstack/react-router";
import EventAnalysis from "@/pages/EventAnalysis";

export const Route = createFileRoute("/app/event/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Analysis — GlobalMatrix" },
      {
        name: "description",
        content: "Full analysis of a single event: sources, affected geography, industries and exposure.",
      },
      { property: "og:title", content: "Event Analysis — GlobalMatrix" },
      {
        property: "og:description",
        content: "Full analysis of a single event: sources, affected geography, industries and exposure.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventAnalysis,
});
