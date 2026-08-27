# OpenBudget Release Checklist

## Correctness

- [ ] `npm test` passes.
- [ ] JavaScript syntax checks pass.
- [ ] Weekly, biweekly, semimonthly, and monthly pay-period fixtures pass.
- [ ] Debt minimums appear in monthly commitments and paycheck reserves.
- [ ] Backup export/import and legacy migration tests pass.
- [ ] Browser end-to-end workflow passes setup → planning → tracking → Decision Center → backup/reset/restore.
- [ ] Tax-data version and application version are correct.

## Privacy and security

- [ ] CSP still contains `connect-src 'none'`.
- [ ] Electron runtime still denies non-local requests.
- [ ] Renderer permissions are denied.
- [ ] No new analytics, telemetry, remote API, updater, newsletter, or embedded web dependency exists.
- [ ] No real personal/financial data is present in tests or screenshots.

## Desktop build

- [ ] `npm run build` succeeds.
- [ ] Built `dist/index.html` references relative assets.
- [ ] Target installer builds successfully.
- [ ] Fresh install launches with the machine offline.
- [ ] Existing-data upgrade/migration works.
- [ ] Backup restore works on a fresh profile.
- [ ] Uninstall behavior is documented and tested.

## User experience

- [ ] First-run setup is understandable without documentation.
- [ ] All destructive actions require confirmation.
- [ ] Empty states explain the next useful action.
- [ ] Financial guidance uses estimate/assumption language where appropriate.
- [ ] Mobile/narrow-window layout remains usable for source-hosted testing.

## Release artifacts

- [ ] Changelog updated.
- [ ] README/START-HERE version updated.
- [ ] SHA-256 hashes generated for distributed binaries/archives.
- [ ] Release email, if used, points only to the official public download page and is never sent by the application itself.
