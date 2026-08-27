# OpenBudget 3.1.1 End-to-End Test Report

Test date: 2026-08-27

## Scope

This release was exercised from a fresh profile through onboarding, tax/paycheck setup, recurring income and bills, budgets, accounts, manual transactions, CSV import, debt payoff, goals, investments, pay-period planning, net worth, purchase affordability, every Decision Center scenario, reports, calendar, backup export, destructive reset, backup restore, invalid-backup rejection, and narrow/mobile navigation.

The browser workflow runs the actual OpenBudget UI source and CSS in Chromium with an isolated test-only local-storage shim. This allows repeatable UI testing without changing the application's production offline protections.

## Automated results

- Finance / tax / affordability / Decision Center unit-regression suite: PASS
- Storage / backup / migration suite: PASS
- Release / privacy / security regression suite: PASS
- JavaScript syntax checks: PASS
- Python local-server syntax checks: PASS
- Chromium end-to-end workflow: PASS — 39 checks
- Portable local-only server launch: PASS
- Local-server port-conflict handling: PASS
- Runtime source scan for remote HTTP endpoints: PASS — none in finance runtime source
- CSP regression: PASS — `connect-src 'none'`
- Electron network request blocker regression: PASS
- Electron renderer permission-denial regression: PASS

## Bugs found and fixed during this audit

1. **Decision Center result dialog did not reopen.** Scenario calculations completed and replaced the dialog content, but the result dialog was never shown again. The result modal now explicitly calls `showModal()` after the input form closes.
2. **Primary paycheck could be overwritten indirectly.** Tax/paycheck updates previously relied on array position. The primary paycheck is now explicitly marked and located, so side income cannot be overwritten when records are reordered or the old primary entry is removed.
3. **Anne Arundel and Frederick 2026 local tax tiers were modeled as marginal brackets.** Their published county schedules select one local rate by taxable-income tier and apply that rate to the full local taxable income. The engine now models that behavior and includes regression fixtures.
4. **CSV import accepted invalid dates.** Invalid calendar dates are now skipped rather than stored as unusable transactions.
5. **CSV transaction type was case-sensitive.** `Income`, `INCOME`, `Expense`, and similar case variants are now normalized before classification.
6. **Portable launcher produced an ugly traceback on a busy port.** The fallback server is now a small local-only Python server that catches the bind error and displays a clear message.
7. **Portable source entry was root-relative.** The source entry is now relative, improving portability while the Vite production build remains configured for relative `file://` assets.

## Tax-source verification

The 2026 federal automated percentage-method tables were checked against IRS Publication 15-T. The 2026 Social Security wage base and rates were checked against SSA/IRS material. Maryland state/county data was checked against the Comptroller of Maryland's 2026 Withholding Tax Facts, including the Anne Arundel and Frederick tier schedules.

Maryland state withholding remains intentionally labeled as a planning estimate because OpenBudget does not yet reproduce every MW507 exemption and employer-specific Maryland payroll rule. Pay-stub calibration remains the recommended way to align the local estimate with an actual employer paycheck.

## Installer-build status

A final Electron installer binary could not be produced in this sandbox because downloading the Vite/Electron build dependencies timed out. This is an environment limitation, not a passing installer test. The source-level Electron hardening, Vite relative-asset configuration, portable launch path, and application workflow are tested; the release checklist still requires building and installing the platform binary on a normal build machine before public distribution.
