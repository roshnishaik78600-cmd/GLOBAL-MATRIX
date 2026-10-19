import { createFileRoute } from "@tanstack/react-router";
import { PublicInfo } from "@/components/landing/PublicInfo";
export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Product & Billing Terms — GlobalMatrix" },
      {
        name: "description",
        content:
          "GlobalMatrix demo-payment conditions, manual renewal, access verification and research limitations.",
      },
      { property: "og:title", content: "Product & Billing Terms — GlobalMatrix" },
      {
        property: "og:description",
        content: "Transparent subscription conditions and current product limitations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicInfo kind="terms" />,
});
