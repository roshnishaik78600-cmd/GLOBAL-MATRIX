import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": "https://globalmatrix.dev/#organization", name: "GlobalMatrix", url: "https://globalmatrix.dev" },
        { "@type": "WebSite", "@id": "https://globalmatrix.dev/#website", name: "GlobalMatrix", url: "https://globalmatrix.dev", publisher: { "@id": "https://globalmatrix.dev/#organization" } },
        { "@type": "SoftwareApplication", name: "GlobalMatrix", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: "https://globalmatrix.dev", description: "Demo event exploration and attributed economic observations for supply-chain exposure research. Paid subscriptions are not currently available." }
      ]
    }) }],
    links: [{ rel: "canonical", href: "https://globalmatrix.dev" }],
    meta: [
      { property: "og:url", content: "https://globalmatrix.dev" },
      { title: "GlobalMatrix — Business Exposure Intelligence" },
      {
        name: "description",
        content:
          "See what changed, trace the impact. GlobalMatrix connects geopolitical events to the countries, flows, infrastructure, industries and businesses they affect.",
      },
      {
        property: "og:title",
        content: "GlobalMatrix — Business Exposure Intelligence",
      },
      {
        property: "og:description",
        content:
          "Global geopolitical and supply-chain exposure intelligence, built on evidence-backed events and exposure data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
