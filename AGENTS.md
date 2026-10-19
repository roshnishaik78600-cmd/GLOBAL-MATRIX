<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all UI colors in semantic global tokens; legacy cyan token names map to the current action accent so existing visualizations stay consistent.
- Reserve AI brief quotas through the service-only atomic database function before generation; map an unlimited allowance to its zero sentinel while keeping per-user interval locking, so concurrent requests cannot bypass allowances or abuse protection.
- Keep the homepage map interactive and reuse the shared WorldMap rather than introducing a second geography renderer.
- Use the shared navigation inventory for the compact, expandable desktop spine and mobile directory; retain one shell scroll viewport to prevent navigation obscuring content.

- Reference storytelling lives in ReferenceStory; IntelligenceExperience owns the scroll-linked visual hero and selectable capability core because marketing interactions must stay separate from analytical data logic. The original nine-stage analysis and WorldMap remain available to preserve analytical workflows.

- Compose PageFrame with explicit workspace, report, directory, laboratory, register or notebook layouts; reports use a section index and full-width ordered bands rather than a uniform KPI grid.
- Render the shared public footer once in the root outside application/admin paths; factual public information pages share PublicInfo so identity, data and billing disclosures remain consistent.
- EventPreview reads the existing event-chain queries; the signature graph leads its page, with local keyboard-selectable nodes and relationship context derived from the same graph edges, so selecting a node does not obscure the network with a global drawer.
- Share PricingPlans and RiskBriefPanel between public pricing displays, reading billing constants and gating paid choices with an availability dialog, so presentation cannot imply a live subscription or diverge across pages.
- Public source status uses a sanitized database summary; raw runs/locks require MFA admin access, so provider diagnostics and scheduling are not publicly exposed.
- Reserve source refreshes atomically and public inquiries through service-only database claims; validate inquiry input on both sides and store interest without implying payment or email delivery.
- Bound legacy initial query reads to three seconds and expose terminal failures to retry boundaries; never substitute demonstration data for failed source reads.
- Use query-state reads for shared source-health indicators and source-register panels, so a connector failure does not replace unrelated application content with a global error screen.
