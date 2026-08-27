# Changelog

## 3.1.1 — End-to-end hardening

- Fixed Decision Center analyses so result dialogs reopen and can be saved after submitting a scenario.
- Prevented paycheck/tax updates from overwriting unrelated side-income entries by explicitly tracking the primary paycheck.
- Corrected Anne Arundel and Frederick County 2026 local tax handling: their income tiers select a rate for the full local taxable income rather than marginally taxing each band.
- Hardened CSV import by rejecting invalid dates and normalizing case-insensitive `income` / `expense` values.
- Changed the portable source entry to a relative module path.
- Replaced the portable Python launcher with a local-only server that reports port conflicts cleanly instead of printing a traceback.
- Added release/security regression tests and a 39-check real-browser UI workflow.

## 3.1.0 — Core hardening

- Feature-froze the built-in baseline in favor of community-led future expansion.
- Fixed semimonthly scheduling so pay dates no longer drift by 15-day increments.
- Added strict calendar-date validation.
- Made debt minimums part of monthly commitments and automatically reserved them across paychecks.
- Fixed debt payoff completion reporting when payments are insufficient or zero.
- Updated housing decisions to replace the existing Housing-category payment rather than double-count it.
- Added backup-age reminders using the configured reminder interval.
- Added versioned backup envelopes, legacy-backup compatibility, backup-size limits, and stronger validation.
- Clarified pre-tax/FICA deduction entry to prevent double-counting.
- Added Electron permission denial, stricter navigation blocking, and disabled renderer spellcheck/webviews.
- Added Vite relative-asset configuration for reliable Electron `file://` production loading.
- Added storage/migration regression tests and expanded finance hardening tests.
- Added contribution guidelines, community roadmap, and release checklist.

## 3.0.0 — Decision Center

- Added a fully local Decision Center using the saved financial profile.
- Added vehicle affordability including payment, insurance, fuel, maintenance, reserves, and cash-flow impact.
- Added rent and home-purchase affordability scenarios.
- Added take-home income change scenarios.
- Added overtime-hours-to-goal planning.
- Added bonus allocation priorities.
- Added debt refinance comparison with fees and break-even analysis.
- Added general monthly what-if stress testing.
- Added local decision-history storage.
- Added automated regression tests for all Decision Center engines.


## 2.2.0

- Replaced federal annual-liability shortcut with the 2026 IRS Publication 15-T automated Percentage Method.
- Added W-4 Step 2, Step 3, Step 4(a), Step 4(b), and Step 4(c) inputs.
- Split federal-taxable pre-tax deductions from FICA-exempt deductions.
- Added year-to-date Social Security and Medicare wages.
- Added Social Security wage-base cutoff handling and Additional Medicare withholding threshold handling.
- Added optional pay-stub net-pay calibration and variance display.
- Preserved fully offline tax tables and network-isolated desktop architecture.
- Added payroll regression tests for Publication 15-T behavior and FICA thresholds.
