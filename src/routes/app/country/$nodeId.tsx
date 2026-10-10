import { createFileRoute } from "@tanstack/react-router";
import CountryProfile from "@/pages/CountryProfile";

export const Route = createFileRoute("/app/country/$nodeId")({
  head: () => ({
    meta: [
      { title: "Country Profile — GlobalMatrix" },
      {
        name: "description",
        content: "Exposure profile for a single country: events, flows, industries and risk.",
      },
      { property: "og:title", content: "Country Profile — GlobalMatrix" },
      {
        property: "og:description",
        content: "Exposure profile for a single country: events, flows, industries and risk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CountryProfile,
});
