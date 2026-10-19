import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PricingPlans, RiskBriefPanel } from "@/components/commerce/PricingPlans";

/** Public pricing shares its data and availability controls with the pricing page. */
export function PricingTeaser() {
  return (
    <section aria-labelledby="pricing-teaser" className="gm-pricing-showcase scroll-mt-20 border-t border-border">
      <div className="gm-pricing-heading text-center">
        <p className="gm-reference-eyebrow">GlobalMatrix / Plans</p>
        <h2 id="pricing-teaser">Start free. Upgrade when you need more.</h2>
        <p>Explore global risks for free. Choose a paid plan when you need more capacity or business support.</p>
      </div>
      <PricingPlans />
      <RiskBriefPanel />
      <div className="mt-8 flex justify-center">
        <Button asChild variant="ghost"><Link to="/pricing">Compare plans & terms <ArrowRight aria-hidden /></Link></Button>
      </div>
    </section>
  );
}
