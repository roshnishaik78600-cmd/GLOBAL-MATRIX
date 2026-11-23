# Operations, security and recovery

## Environments
- **Preview**: latest code in the Lovable editor. Shares the same database as production.
- **Production**: https://globalmatrix.dev — updates only when "Publish" is pressed.
- Database changes apply to both immediately; app code changes need a publish.

## Release process
1. Changes land on `main` (synced from Lovable). CI (`.github/workflows/ci.yml`) must pass.
2. Add an entry to `CHANGELOG.md`.
3. Publish from Lovable. Optionally tag the release on GitHub (`vYYYY.MM.DD`).
4. Check `https://globalmatrix.dev/api/public/health` returns `{"status":"ok"}`.

## Rollback
- **App code**: restore an earlier version from Lovable's version history, then publish.
- **Database**: never edit applied migrations. Write a new corrective migration that reverses the change.

## Backups and restore
- The database is backed up by Lovable Cloud. Data export: More → Database → Manage → Settings → Export data.
- Restore testing has **not** been performed yet.

## Security checklist
- [x] Row-level security on every table; admin tables readable only by MFA-verified admins.
- [x] Admin actions checked server-side (role + MFA) on every request.
- [x] Server-side rate limits for public inquiries, source refreshes and AI briefs.
- [x] CSRF protection on server functions; baseline security headers.
- [x] Only publishable keys in code; service credentials server-only.
- [ ] Replace the private decryption key leaked in old GitHub history.
- [ ] Content Security Policy (needs testing against the editor preview and third-party scripts).
- [ ] Error-monitoring provider (e.g. Sentry) — not configured.
- [ ] Alerting for failed source refreshes — not configured.
- [ ] Login/password-reset limits rely on the auth provider's built-in limits.

## Known risks
- Payments are demo-only; no real money can be collected.
- No email delivery until a sender domain is verified.
- No admin account exists until globalmatrix.support@gmail.com signs up and confirms.
