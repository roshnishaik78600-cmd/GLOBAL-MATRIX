import { createFileRoute } from "@tanstack/react-router";
import { PublicInfo } from "@/components/landing/PublicInfo";
export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact — GlobalMatrix" },
      {
        name: "description",
        content: "Send GlobalMatrix a product inquiry or a proposed supply-chain report scope.",
      },
      { property: "og:title", content: "Contact — GlobalMatrix" },
      { property: "og:description", content: "Product questions and custom research inquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicInfo kind="contact" />,
});
