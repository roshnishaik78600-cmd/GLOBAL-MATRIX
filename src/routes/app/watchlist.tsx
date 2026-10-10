import { createFileRoute } from "@tanstack/react-router";
import Watchlist from "@/pages/Watchlist";

export const Route = createFileRoute("/app/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — GlobalMatrix" },
      {
        name: "description",
        content: "Your saved countries, industries and events, tracked for new developments.",
      },
      { property: "og:title", content: "Watchlist — GlobalMatrix" },
      {
        property: "og:description",
        content: "Your saved countries, industries and events, tracked for new developments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Watchlist,
});
