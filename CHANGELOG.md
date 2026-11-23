# Changelog

All notable changes to GlobalMatrix. Dates are UTC.

## 2026-11-23
- Account settings: password change and self-service account deletion (saved research removed; order/payment records retained).
- Header search no longer crashes a page when its data loads slowly.
- Failed AI briefs no longer consume the daily allowance; previous saved briefs are kept if a replacement fails to save.
- Watchlist and note errors are shown instead of silently returning empty data.
- Admin customer list treats expired paid plans as Free.
- Admin role check no longer callable by signed-out visitors.
- Baseline security headers and a public health endpoint (`/api/public/health`).
- GitHub Actions CI: type check, lint, tests, build.
