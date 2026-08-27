# OwnLedger Offline Tax Data

OwnLedger never downloads tax data at runtime. Tax rules are bundled with each tested application release so the installed finance application can remain completely offline.

## Current pack

- Tax year: 2026
- Data version: 2026.1
- Federal annual tax brackets and standard deductions: bundled
- Social Security and Medicare employee tax rules: bundled
- Maryland state income-tax brackets: bundled
- Maryland county/Baltimore City local income-tax rates: bundled
- States without a broad wage income tax: recognized as zero state wage-income tax for planning
- Other states/localities: user-entered effective withholding rate until a verified jurisdiction pack is bundled

## Why take-home pay is an estimate

Payroll withholding is not identical to annual tax liability. Actual checks may differ because of Form W-4 elections, employer payroll methods, bonuses, credits, pre-tax benefit treatment, retirement/HSA/FSA deductions, multiple jobs, residency/work-location rules, and jurisdiction-specific deductions or exemptions.

OwnLedger therefore labels the result as an estimate and exposes the assumptions instead of promising false precision. Users can calibrate the estimate against a real pay stub.

## Release process

Tax packs should be updated only as part of a tested OwnLedger release. The installed application must not make internet requests to check tax rates.

Before publishing a new pack:

1. Verify federal rules against current IRS publications.
2. Verify each state/local rule against the responsible government tax authority.
3. Add automated regression tests.
4. Record the tax year and data version.
5. Publish the updated application as a new signed/reproducible release.


## OwnLedger 2.2 federal withholding method

Federal income-tax withholding now implements the 2026 IRS Publication 15-T Section 1 automated Percentage Method workflow for current Forms W-4. The bundled annual schedules are stored in `src/tax-data.js`; the calculation is in `src/tax-engine.js`.

Supported W-4 inputs:
- Step 1(c) filing status
- Step 2 checkbox
- Step 3 annual credits
- Step 4(a) other annual income
- Step 4(b) annual deductions
- Step 4(c) additional withholding per paycheck

FICA also supports separate FICA-exempt deductions and year-to-date Social Security/Medicare wages so wage-base thresholds can be modeled per paycheck.

OwnLedger still labels the result an **estimate** because employer payroll setup, benefit taxability, supplemental wages, special employee classifications, and jurisdiction-specific payroll rules may differ. The optional pay-stub calibration field helps users compare the model with their actual net pay without sending any data off-device.
