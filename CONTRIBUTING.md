# Contributing to OwnLedger

Bug fixes, tests, tax packs, documentation, accessibility work, design improvements, translations, and new financial tools are welcome.

## Core rules
1. **OwnLedger Core stays offline.** No telemetry, analytics, ads, bank APIs, cloud sync, remote content, or automatic update checks without explicit architecture review.
2. **Calculation changes require tests.** Financial logic needs regression coverage and visible assumptions.
3. **Storage changes require migrations.** Never strand or silently destroy user data.
4. **Keep input simple.** Prefer understandable workflows over feature density.
5. **Do not collect unnecessary secrets.** Do not ask for passwords, PINs, SSNs, or full card/account credentials.

## Development
```bash
npm install
npm test
npm run build
```
See `docs/DEVELOPMENT.md` and `docs/TESTING.md`.

## Pull requests
Keep PRs focused. Explain the problem, behavior change, tests, storage implications, and network implications. UI changes should include screenshots when practical. Large architectural changes should begin as a Discussion or Issue.

## Tax data
Tax changes must identify jurisdiction, tax year, authoritative government source, effective date, assumptions, and regression cases. Do not download tax rules at runtime.

## Security
Do not open a public Issue for vulnerabilities that could expose, corrupt, alter, or destroy financial data. Follow `SECURITY.md`.
