import { createFileRoute } from "@tanstack/react-router";
import NotAvailable from "@/pages/NotAvailable";

export const Route = createFileRoute("/app/policy")({
  head: () => ({
    meta: [
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
