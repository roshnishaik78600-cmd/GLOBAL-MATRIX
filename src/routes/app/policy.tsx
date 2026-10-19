import { createFileRoute } from "@tanstack/react-router";
import NotAvailable from "@/pages/NotAvailable";

export const Route = createFileRoute("/app/policy")({
  staticData: { sitemap: false },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/app/policy" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/app/policy" },
      { title: "Policy Tracker — GlobalMatrix" },
      {
        name: "description",
        content: "Policy and regulatory tracking in GlobalMatrix.",
      },
      { property: "og:title", content: "Policy Tracker — GlobalMatrix" },
      {
        property: "og:description",
        content: "Policy and regulatory tracking in GlobalMatrix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotAvailable,
});
