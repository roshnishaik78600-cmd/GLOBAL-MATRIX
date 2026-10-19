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
- Reserve AI brief quotas through the service-only atomic database function before generation; per-user locking prevents concurrent requests bypassing allowances.
- Keep the homepage map interactive and reuse the shared WorldMap rather than introducing a second geography renderer.
- Use the shared navigation inventory for the compact, expandable desktop spine and mobile directory; retain one shell scroll viewport to prevent navigation obscuring content.

- Reference storytelling lives in ReferenceStory; IntelligenceExperience owns the scroll-linked visual hero and selectable capability core because marketing interactions must stay separate from analytical data logic. the original nine-stage analysis and WorldMap remain available to preserve analytical workflows.

- Compose PageFrame with explicit workspace, report, directory, laboratory, register or notebook layouts; reports use a section index and full-width ordered bands rather than a uniform KPI grid.
