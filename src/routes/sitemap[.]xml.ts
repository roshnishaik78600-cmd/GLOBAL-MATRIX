import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import {
  isSitemapRouteIncluded,
  sitemapPathForLocation,
  sitemapStaticPaths,
  sitemapXML,
  type SitemapEntry,
} from "@/lib/sitemap";
import { COUNTRIES } from "@/lib/intel/countries";
import { INDUSTRIES } from "@/lib/intel/industries";

const BASE_URL = "https://globalmatrix.dev";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        const countryRoute = "/app/country/$nodeId";
        if (isSitemapRouteIncluded(router.routesById[countryRoute])) {
          for (const c of COUNTRIES) {
            const loc = router.buildLocation({
              to: countryRoute,
              params: { nodeId: c.nodeId },
              search: () => ({}),
              hash: "",
            });
            const path = sitemapPathForLocation(router, loc, countryRoute);
            if (path) entries.push({ path });
          }
        }
        const industryRoute = "/app/industry/$industryId";
        if (isSitemapRouteIncluded(router.routesById[industryRoute])) {
          for (const i of INDUSTRIES) {
            const loc = router.buildLocation({
              to: industryRoute,
              params: { industryId: i.id },
              search: () => ({}),
              hash: "",
            });
            const path = sitemapPathForLocation(router, loc, industryRoute);
            if (path) entries.push({ path });
          }
        }

        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
