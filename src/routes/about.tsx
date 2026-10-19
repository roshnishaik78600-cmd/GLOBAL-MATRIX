import { createFileRoute } from "@tanstack/react-router";
import { PublicInfo } from "@/components/landing/PublicInfo";
export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "About — GlobalMatrix" },
      {
        name: "description",
        content:
          "What GlobalMatrix investigates and the limits of its business exposure intelligence.",
      },
      { property: "og:title", content: "About — GlobalMatrix" },
      {
        property: "og:description",
        content: "Evidence-led business exposure research, with product limitations in view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicInfo kind="about" />,
});
