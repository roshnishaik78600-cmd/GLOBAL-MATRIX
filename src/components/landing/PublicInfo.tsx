import { Link } from "@tanstack/react-router";
import { RequestForm } from "@/components/commerce/RequestForm";
import { Button } from "@/components/ui/button";

export function PublicInfo({ kind }: { kind: "about" | "contact" | "privacy" | "terms" }) {
  const titles = {
    about: "Intelligence, with its limits in view.",
    contact: "Contact GlobalMatrix",
    privacy: "Privacy & data transparency",
    terms: "Product & billing terms",
  };
  return (
    <main className="gm-public-info gm-width px-6 py-16">
      <Button asChild variant="link" className="px-0">
        <Link to="/">← GlobalMatrix</Link>
      </Button>
      <p className="gm-reference-eyebrow mt-10">GlobalMatrix / {kind}</p>
      <h1 className="mt-6 text-4xl font-medium">{titles[kind]}</h1>
      {kind === "about" && (
        <>
          <p className="mt-6 text-lg text-muted-foreground">
            Geopolitical and supply-chain exposure intelligence for businesses investigating their
            dependencies.
          </p>
          <section>
            <h2>What you can investigate</h2>
            <p>
              Explore geopolitical demonstration events, country and industry exposure, trade
              context and modelled propagation pathways. Inspect assumptions, save relevant items
              and generate evidence-led AI briefs.
            </p>
          </section>
          <section>
            <h2>Evidence, not invented credibility</h2>
            <p>
              Economic observations are attributed to their sources. Event scenarios and exposure
              models are not verified live intelligence. Named supplier exposure and market-price
              feeds are not connected.
            </p>
            <Link to="/methodology">Read the methodology →</Link>
          </section>
          <section>
            <h2>Company information</h2>
            <p>
              Verified legal-entity details, a business address and a public support email have not
              been supplied. We do not display unverified company credentials or customer
              endorsements.
            </p>
            <Link to="/contact">Send an inquiry →</Link>
          </section>
        </>
      )}
      {kind === "contact" && (
        <>
          <p className="mt-6 text-muted-foreground">
            Send a product question or describe a report scope. Your request is saved for review; an
            immediate response is not guaranteed.
          </p>
          <div className="mt-10 max-w-2xl">
            <RequestForm defaultKind="contact" />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Do not include passwords, payment credentials or sensitive supplier information.
          </p>
        </>
      )}
      {kind === "privacy" && (
        <>
          <p className="mt-6 text-muted-foreground">
            This notice describes the current application’s data handling. A reviewed legal privacy
            policy and verified operator contact details have not yet been supplied.
          </p>
          <section>
            <h2>Information you provide</h2>
            <p>
              Account registration uses your email, password and name. Social sign-in may provide a
              name and avatar. Saved watchlists, notes, AI briefs and declared business dependencies
              are associated with your account. An exposure profile may include company name,
              industry, sourcing locations, products and concerns.
            </p>
          </section>
          <section>
            <h2>Inquiries and billing records</h2>
            <p>
              Contact requests store your name, email, optional company, message and request type.
              Orders record product, price, currency, status, timestamps and account identifier.
              Payment review actions are recorded for auditing. Demo orders do not represent
              collected payments.
            </p>
          </section>
          <section>
            <h2>Access and browser storage</h2>
            <p>
              Sign-in sessions use browser storage. Private account records are protected by
              account-level access rules; payment review requires authorized administration. The
              application uses Lovable Cloud for account and record storage.
            </p>
          </section>
          <section>
            <h2>Before sharing sensitive information</h2>
            <p>
              Retention periods, operator identity and a formal data-rights process are not
              confirmed here. Do not upload confidential business or personal information without
              resolving these details. You can submit questions through the inquiry form; automated
              account deletion is not offered on this page.
            </p>
            <Link to="/contact">Ask about data handling →</Link>
          </section>
        </>
      )}
      {kind === "terms" && (
        <>
          <p className="mt-6 text-muted-foreground">
            Current product and billing conditions, not a substitute for a reviewed legal agreement.
            Operator details and a formal refund policy are still to be supplied before live
            payments.
          </p>
          <section>
            <h2>Research use and limitations</h2>
            <p>
              Demonstration events, inferred relationships, model scores and AI-generated briefs are
              research context, not predictions or financial advice. Verify source observations and
              your actual dependencies before making business decisions. Supplier-level exposure
              remains unmeasured.
            </p>
          </section>
          <section>
            <h2>Demo payments</h2>
            <p>
              Payments are currently disabled. Any QR is labelled “DEMO QR — NOT FOR PAYMENT”.
              Creating an order, submitting a reference or uploading an image cannot activate paid
              access. Demo orders cannot be approved as paid.
            </p>
          </section>
          <section>
            <h2>Plans and access</h2>
            <p>
              Plans share the same data coverage and differ in daily AI-brief allowances. Paid
              access requires a verified, active, unexpired subscription. Monthly paid access uses
              manual renewal, not automatic recurring charges. Annual billing is not offered.
            </p>
            <Link to="/pricing">View current prices and limits →</Link>
          </section>
          <section>
            <h2>Cancellation, upgrades and expiry</h2>
            <p>
              You can cancel eligible open orders from Billing. This cancels the order, not an
              active subscription. There is no automatic renewal; unrenewed or expired paid access
              returns to Free Explorer. A self-service active-subscription cancellation or downgrade
              control is not currently provided. New paid orders still require payment verification.
            </p>
          </section>
          <section>
            <h2>One-time reports</h2>
            <p>
              The custom supply-chain risk brief is separate from subscriptions. Its scope must be
              confirmed, and delivery timing starts only after payment verification and scope
              confirmation. In demo mode, no paid report work is activated.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
