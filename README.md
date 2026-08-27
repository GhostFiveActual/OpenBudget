# OpenBudget 3.1.1

OpenBudget is a free, MIT-licensed, offline personal-finance desktop application. Its purpose is simple: give people one private place to understand cash flow, plan paychecks, track debt and savings, estimate take-home pay, and make everyday financial decisions without sending their financial information to the internet.

## Release scope

Version 3.1 is the **feature-complete baseline**. The focus is correctness, simplicity, offline safety, reliable backups, migrations, and installer readiness. New finance modules are intentionally left for community proposals and contributions.

## Included

- Dashboard and Action Center
- Decision Center for purchases, vehicles, housing, income changes, overtime, bonuses, refinancing, and what-if scenarios
- Pay-period planning for weekly, biweekly, semimonthly, and monthly payrolls
- Recurring income, bills, and subscriptions
- Automatic per-paycheck debt-minimum reserve
- Monthly category budgets
- Manual transactions and offline CSV import
- Accounts, assets, net worth, and investments
- Debt avalanche/snowball payoff planning
- Goals and sinking funds
- 90-day money calendar and reports
- 2026 federal paycheck withholding using bundled IRS Publication 15-T data
- Maryland 2026 planning tax pack and offline effective-rate fallback for unsupported jurisdictions
- Paystub calibration
- JSON backup and restore
- Desktop runtime network kill-switch

## Simple data-entry rule

Enter each obligation once. Recurring household bills belong in **Bills & Subscriptions**. Credit-card and loan minimums belong in **Debt Payoff**; OpenBudget automatically reserves those minimum payments across paychecks, so users should not duplicate the same minimum as a bill.

## Privacy model

The production desktop application has no runtime dependency on the internet. It includes no bank login, telemetry, analytics, advertisements, newsletter form, remote tax lookup, embedded website, or automatic updater.

Two independent controls enforce this:

1. The UI Content Security Policy uses `connect-src 'none'`.
2. Electron cancels non-local requests at runtime and denies renderer permission requests.

The renderer runs with `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. See `SECURITY.md`.

## Build and test

Requires Node.js 20+.

```bash
npm install
npm test
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Vite is configured with relative production asset paths so Electron can load `dist/index.html` from `file://` without an internet or local web server dependency.

For source-only local testing with Python 3:

```bash
./launch-local.sh
```

Windows users can run `launch-local.bat`. Both bind only to `127.0.0.1`.

## Backups

OpenBudget has no cloud account, so the device is the primary data copy. Use **Settings & Backup → Export OpenBudget backup** regularly. Version 3.1 writes a versioned backup envelope while continuing to import legacy direct-state backups.

Backups are intentionally plain JSON for long-term portability. They may contain sensitive financial data and should be stored only on encrypted or otherwise protected storage.

## Tax accuracy

Federal withholding uses bundled 2026 IRS Publication 15-T automated percentage-method data for modern Forms W-4. State/local coverage is explicitly versioned. Tax and take-home results are planning estimates, not tax preparation or payroll guarantees. A real paystub can be entered to calibrate the user's recurring take-home amount.

See `TAX-DATA.md`.

## CSV import

Required columns: `date`, `description`, `amount`. Optional columns: `type`, `category`.

```csv
date,description,amount,type,category
2026-08-01,Paycheck,2500,income,Paycheck
2026-08-02,Rent,-1500,expense,Housing
2026-08-03,Groceries,-82.14,expense,Groceries
```

## Contributing

OpenBudget 3.1.1 intentionally stops expanding the built-in feature set. Improvements and additional modules should come through normal open-source discussion and review. Start with `CONTRIBUTING.md` and `COMMUNITY-ROADMAP.md`.

## License

MIT. See `LICENSE`.
