import { createFileRoute } from "@tanstack/react-router";
import { PublicInfo } from "@/components/landing/PublicInfo";
export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://globalmatrix.dev/privacy" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev/privacy" },
      { title: "Privacy & Data Transparency — GlobalMatrix" },
      {
        name: "description",
        content:
          "Current GlobalMatrix account, inquiry and billing data handling and unconfirmed policy details.",
      },
      { property: "og:title", content: "Privacy & Data Transparency — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Understand the information the application stores and remaining privacy-policy requirements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicInfo kind="privacy" />,
});
