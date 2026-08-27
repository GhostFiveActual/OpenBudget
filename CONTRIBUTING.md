# Contributing to OpenBudget

Thank you for helping improve a free, private personal-finance tool.

## Project principles

Every contribution must preserve these rules:

1. **Offline means offline.** The installed application may not require or silently contact an internet service.
2. **No financial surveillance.** No telemetry, analytics, ads, fingerprinting, crash uploads, bank aggregation, or behavioral tracking.
3. **Simple before clever.** A non-finance expert should understand the input and the result.
4. **Explain assumptions.** Financial, tax, and decision calculations must expose important assumptions instead of pretending estimates are guarantees.
5. **Portable data.** Users must retain the ability to export understandable local data.
6. **Tests are required for calculation changes.** Any change to finance, recurrence, tax, payoff, or Decision Center logic must include regression coverage.

## Before opening a pull request

```bash
npm test
node --check src/main.js
node --check src/engine.js
node --check src/store.js
node --check src/tax-engine.js
node --check electron/main.cjs
```

If dependencies are installed, also run:

```bash
npm run build
```

For installer-related changes, test the generated installer on the target operating system with networking disabled.

## Good contribution areas

- Accessibility and keyboard navigation
- Localization/internationalization
- Additional verified state/local tax packs
- More CSV import mappings without remote bank connectivity
- Tests and test fixtures using synthetic data only
- Documentation and onboarding improvements
- Performance improvements for large local transaction histories
- Additional Decision Center scenarios proposed through an issue first
- Optional at-rest encryption designs that remain fully local

## Sensitive data

Never attach real paystubs, tax forms, bank exports, account numbers, financial backups, or screenshots containing personal financial information to issues or pull requests. Use synthetic examples only.

## Scope proposals

For a new finance module, open an issue describing:

- the user question it answers,
- the minimum inputs required,
- the formulas/authoritative sources,
- how it remains offline,
- edge cases and failure states,
- what tests would prove it correct.

Large additions should not be merged merely because they are possible. OpenBudget should remain understandable.
