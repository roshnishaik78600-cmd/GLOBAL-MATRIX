import { createFileRoute } from "@tanstack/react-router";
import CountryProfile from "@/pages/CountryProfile";
import { getNode } from "@/lib/intel/nodes";

export const Route = createFileRoute("/app/country/$nodeId")({
  staticData: { sitemap: true },
  head: ({ params }) => {
    const name = getNode(params.nodeId).label;
    const url = `https://globalmatrix.lovable.app/app/country/${params.nodeId}`;
    const title = `${name} supply-chain exposure — GlobalMatrix`;
    const description = `${name}: trade dependencies, chokepoints, industries and modelled risk exposure, with sources and limitations.`;
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
  component: CountryProfile,
});
