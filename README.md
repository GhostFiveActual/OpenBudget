# OwnLedger

**Your money. Your computer. Your data.**

OwnLedger is a free, open-source, offline-first personal finance and financial decision application. It helps people understand cash flow, plan paychecks, track bills and debt, estimate take-home pay, monitor goals and investments, and evaluate major purchases without surrendering their financial data to another company.

> **No account. No bank connection. No subscription. No ads. No analytics. No cloud financial database.**

## Download
Use the installers attached to the latest GitHub Release. Windows uses `OwnLedger-*-Windows-Setup.exe`; macOS uses the DMG; Linux releases include AppImage and DEB packages.

## MVP status
OwnLedger 1.0.0 is the first public MVP. It is useful today, but intentionally not feature-complete. The project is open for community improvements, tax jurisdictions, accessibility, translations, new financial tools, UI work, documentation, and other ideas that preserve the privacy model.

## Included
- Dashboard and Action Center
- Pay-period planning and recurring income
- Bills and subscriptions
- Accounts and manual transactions
- Offline CSV import
- Debt payoff planning
- Savings goals and sinking funds
- Investment tracking and projections
- Net-worth tracking
- Offline payroll/tax estimation for supported jurisdictions
- Affordability tools and Decision Center scenarios
- Calendar and reports
- Versioned backup, restore, reset, and legacy OpenBudget migration

## Privacy architecture
The installed desktop application is designed to work without internet access. The renderer CSP uses `connect-src 'none'`; Electron blocks non-local requests, external navigation, popups, and renderer permission requests; and the renderer receives no Node.js or shell bridge. OwnLedger has no telemetry, analytics, bank API, advertising SDK, cloud account, automatic update check, or newsletter client.

Backups are plain JSON for portability. Treat them as sensitive and store them securely. See `SECURITY.md` and `docs/PRIVACY.md`.

## Financial calculations
Tax, payroll, investment, debt, and affordability results are planning estimates and educational tools—not tax, legal, investment, or individualized financial advice. Tax rules are bundled into tested releases rather than downloaded at runtime. See `TAX-DATA.md`.

## Build from source
```bash
npm install
npm test
npm run build
```
Desktop installers: `npm run dist:win`, `npm run dist:mac`, or `npm run dist:linux`.

## Contributing
Contributions are welcome. Start with `CONTRIBUTING.md`, `COMMUNITY-ROADMAP.md`, and `docs/DEVELOPMENT.md`.

> **OwnLedger Core stays offline.**

Calculation changes require tests. Storage changes require safe migrations. Network functionality requires explicit architectural discussion.

## Security
Do not disclose sensitive vulnerabilities in public Issues. Follow `SECURITY.md` and use GitHub private vulnerability reporting when enabled.

## License
MIT. Fork it, improve it, learn from it, and build on it.
