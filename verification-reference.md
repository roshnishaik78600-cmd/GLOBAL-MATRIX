# Orizon reference redesign — verification

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
- Shared design applies throughout; the complete bespoke layout rewrite of every individual data/profile page remains unfinished.
- Live payments remain disabled pending the real QR/payment setup. Demo QR is labelled “DEMO QR — NOT FOR PAYMENT”.
- Revenue, real payment verification, OAuth signup and post-MFA approvals were not tested or represented as working.