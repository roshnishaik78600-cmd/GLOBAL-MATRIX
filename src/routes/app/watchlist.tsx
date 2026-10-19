import { createFileRoute } from "@tanstack/react-router";
import Watchlist from "@/pages/Watchlist";

export const Route = createFileRoute("/app/watchlist")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/watchlist" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/watchlist" },
      { name: "robots", content: "noindex" },
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
