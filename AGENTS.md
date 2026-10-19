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
- Use the shared navigation inventory for the persistent desktop rail and mobile directory; keep one shell scroll viewport so navigation never obscures page content.
