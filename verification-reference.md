# Orizon reference redesign — verification

## Premium product experience — 19 October 2026
- Business-focused homepage headline and an interactive event preview use the existing demonstration feed and chain queries. The chosen event carries into the Impact Graph. Supplier dependencies remain explicitly unmeasured; no live-news or customer-review claims were added.
- Graph now leads its page. Keyboard-selectable nodes use larger hit areas and local selection, avoiding the global country drawer covering the network; the context panel displays actual edge labels/weights and links to evidence. The longer business workflow remains expandable.
- Overview no longer waits for secondary macro readings before showing its exposure map. Loading state identifies the page and data being requested.
- Pricing retains central-config prices and allowances, adds visible daily brief capacity, mobile comparison and billing/data FAQs. No new discounts, annual billing or entitlements.
- Shared footer appears once across public pages. About, Contact, Privacy/data transparency and Product/billing terms use working destinations. Legal notices explicitly identify missing operator/formal-policy information rather than fabricate it. Existing inquiry confirmation no longer promises an unconfirmed reply deadline.
- Browser checks: 14 representative destinations at 1280×1800, 951×609 and 390×844; no document overflow or uncaught runtime exceptions. Event switch, event-to-graph navigation, keyboard node selection, billing FAQ and mobile Pricing navigation passed.
- Signed-in billing: created Analyst demo order, read it back as pending payment, cancelled it from Billing and reloaded to confirm persisted cancellation; Free Explorer remained at five AI briefs/day. No real purchase, paid activation or post-MFA approval tested.
- 31/31 existing tests passed. Edited files linted without errors (ReferenceStory retains a Fast Refresh export warning). Harness build/type checks reported build OK. Existing full-project lint issues were not claimed resolved.
- Evidence: `/tmp/browser/premium/` scripts, results and screenshots. Formal privacy/terms review, verified operator contact and live payment setup still require owner-provided information.

## Final black / burgundy transformation
- User's latest dark brief supersedes the older white/lime theme documented below. Obsidian background, ivory type, burgundy actions and aubergine selection tokens replace green across existing chart/status aliases.
- New `IntelligenceExperience.tsx`: full-bleed original globe scene with scroll-linked movement and animated geographic paths, alternating product compositions, selectable six-capability core with meaningful explanations and existing-route links.
- Rebuilt `Landing.tsx` hero and section composition; `ReferenceStory.tsx` now uses seven propagation stages, explicit demonstration evidence/confidence/interval, translucent scroll-sensitive navigation, mobile menu and conversion CTA.
- `Overview.tsx` places the actual interactive map before the supporting signal composition. `Shell.tsx` has translucent scroll-sensitive navigation and design-system controls; existing single scroll viewport, navigation inventory and all drawers preserved.
- Shared `styles.css` and `ui/button.tsx` apply the dark system to existing reports, country/industry directories, graph, risk, trade, markets, supply, scenarios, watchlists, analyst, sources, auth, pricing, checkout, billing and admin. These analytical tools were preserved, not individually replaced with mockups.
- Browser sweep: 31 destinations × desktop (1280×1800), tablet/current viewport (951×609), phone (390×844), no uncaught runtime exceptions or document overflow. Scenario simulation ran. Selected capability linked to `/app/watchlist`; stage 05 stated supplier data is unmeasured; stage 02 displayed the event confidence and interval. Mobile menu reached Pricing.
- Signed-in demo billing: new ₹999 Analyst order created, cancelled and read back in Billing. Free Explorer stayed at five briefs/day, no funds moved, no paid activation. Admin still required two-step verification; post-code admin review untested.
- All 31 existing tests passed. Final changed-component lint had zero errors and two Fast Refresh export warnings. Harness reported build OK; no manual build/typecheck run. Pre-existing full-project lint failures are not claimed resolved.
- Compared against Orizon's freshly fetched live screenshot: recognizable centered visual/stage rhythm, but original GlobalMatrix geography and user-directed dark palette, not identical proprietary animation. Backend/schema/payment rules unchanged.

## Changed presentation files
- `src/styles.css`: extracted white/ink/lime palette, shared executive aliases, centred story layouts, orbital linework, lightweight surfaces, mobile sizing.
- `src/components/landing/ReferenceStory.tsx`: original ecosystem artwork, mobile navigation, section progress, five-stage event-driven story, footer.
- `src/assets/intelligence-orbit.jpg`: original generated global-intelligence artwork; no Orizon assets copied.
- `src/pages/Landing.tsx`: rebuilt homepage composition, retained interactive WorldMap and original nine-stage explorer.
- `src/components/landing/PricingTeaser.tsx`, `src/routes/pricing.tsx`: centred plan comparison and conversion hierarchy; existing prices unchanged.
- `src/pages/Auth.tsx`, `src/routes/__root.tsx`: reference typography and auth presentation; authentication behavior unchanged.
- `src/components/viz/Shell.tsx`, `Drawer.tsx`, `NavRail.tsx`: coherent light navigation and token-based overlays.
- `src/routes/app/billing.tsx`: unframed billing sections and visible account-checking state.
- `src/components/ui/button.tsx`: semantic destructive foreground token.

## Checks completed
- Full reconstruction pass: added explicit report, directory, notebook, laboratory, register and atlas compositions to active pages. Event/country/industry reports have section indices and ordered full-width bands; country regional rosters and industry catalogues replace repeated cards. Sources use a connected register; billing pairs plan with ledger; auth is a centered form rather than a split marketing panel. Admin statistics and MFA gate presentation updated without changing permissions.
- Overview rebuilt again to a centered visual masthead, numbered exploration stages and full-width interactive atlas. Graph and impact pages retain their actual network/nine-stage tools and add an event-driven five-stage narrative with supplier gaps explicitly unmeasured.
- Homepage now follows seven ordered sections; scroll progress identifies the section at the reading threshold, verified by navigating to stage 05. Desktop navigation expands from 64px to 208px after hydration.
- Latest browser sweep: 31 routes at 1280×1800, 951×609 and 390×844; no document overflow or uncaught runtime exceptions. Settled captures used instead of initial loading states. Scenario execution and supplier-stage selection checked. Final overview map renders at all three widths.
- Latest signed-in billing: created and cancelled another ₹999 Analyst demo order; both cancelled records read back, Free Explorer stayed at five briefs/day. Admin MFA gate still required; no approval tested.
- Latest edited-file lint: zero errors and two export warnings. Full-project lint still fails with 490 errors and 23 warnings, mostly pre-existing formatting; it is not an errorless-project claim.
- Existing tests: **31 passed**, four files covering billing rules, demo payments, brief allowances and routing.
- Harness build log: latest checks reported **build OK**. No manual build/typecheck was run.
- Changed-file ESLint: no errors; fast-refresh export warnings. Full-project lint did **not** pass: 491 errors, predominantly pre-existing formatting, plus a prefer-const finding in generated auth storage. Generated files were not modified.
- Compared actual Orizon default-theme screenshots at desktop and phone sizes, including ecosystem, services, comparison and conversion/footer sections.
- Checked 18 additional page families at 1280×1800, 951×609 and 390×844: no blank body, horizontal document overflow or uncaught runtime errors observed.
- Public homepage, overview, graph, risk, trade, pricing and login checked at those sizes. Mobile menu and supplier-stage interaction confirmed in fresh settled runs with no console errors.
- One initial pricing capture logged an input-style hydration warning; the fresh pricing interaction check did not reproduce it. It was not claimed as a fixed code defect.
- Signed-in admin account: created Analyst demo order at ₹999; cancelled it; read the saved cancelled record through billing; plan remained Free Explorer, five briefs/day. No funds moved or subscription unlocked.
- `/admin` displayed Two-step verification; no MFA secret was captured and no factor enrolled for testing. Post-code admin review remains unverified.

## Limitations
- The reference's proprietary animated visual is replaced with original globe artwork and functional section/stage transitions, not an identical 3D animation.
- Presentation now varies by analytical task throughout the page families; the existing analytical charts and inner controls are retained rather than replaced with static reference mockups. This is a close design-language adaptation, not a pixel-identical copy of Orizon's site or proprietary animation.
- Live payments remain disabled pending the real QR/payment setup. Demo QR is labelled “DEMO QR — NOT FOR PAYMENT”.
- Revenue, real payment verification, OAuth signup and post-MFA approvals were not tested or represented as working.