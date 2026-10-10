import { createFileRoute } from "@tanstack/react-router";
import Countries from "@/pages/Countries";

export const Route = createFileRoute("/app/countries")({
  head: () => ({
    meta: [
      { title: "Countries — GlobalMatrix" },
      {
        name: "description",
        content: "Browse every country tracked by GlobalMatrix, with exposure scores and recent events.",
      },
      { property: "og:title", content: "Countries — GlobalMatrix" },
      {
        property: "og:description",
        content: "Browse every country tracked by GlobalMatrix, with exposure scores and recent events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Countries,
});
