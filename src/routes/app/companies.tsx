import { createFileRoute } from "@tanstack/react-router";
import NotAvailable from "@/pages/NotAvailable";

export const Route = createFileRoute("/app/companies")({
  head: () => ({
    meta: [
      { title: "Companies — GlobalMatrix" },
      {
        name: "description",
        content: "Company-level exposure tracking in GlobalMatrix.",
      },
      { property: "og:title", content: "Companies — GlobalMatrix" },
      {
        property: "og:description",
        content: "Company-level exposure tracking in GlobalMatrix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotAvailable,
});
