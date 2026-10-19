import { createFileRoute } from "@tanstack/react-router";
import IndustryProfile from "@/pages/IndustryProfile";
import { getIndustry } from "@/lib/intel/industries";

export const Route = createFileRoute("/app/industry/$industryId")({
  staticData: { sitemap: true },
  head: ({ params }) => {
    const ind = getIndustry(params.industryId);
    const name = ind?.label ?? "Industry";
    const url = `https://globalmatrix.dev/app/industry/${params.industryId}`;
    const title = `${name} supply-chain risk — GlobalMatrix`;
    const description =
      ind?.summary ??
      "Exposure profile for a single industry: countries, inputs, routes and dependencies.";
    return {
      links: [{ rel: "canonical", href: url }],
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: IndustryProfile,
});
