# Testing

- `tests/engine.test.mjs` — finance, tax, affordability, Decision Center, recurrence, payoff regressions
- `tests/store.test.mjs` — storage, backup validation, migration, compatibility
- `tests/release.test.mjs` — offline/security/release invariants
- `tests/e2e_ui.py` — browser workflow across major user journeys

Run JS suites with `npm test`. GitHub CI also runs browser E2E and a production build. Calculation fixes should add a regression test.
