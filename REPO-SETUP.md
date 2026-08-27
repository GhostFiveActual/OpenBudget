# GitHub Repository Setup

After renaming the repository to `OwnLedger`:

1. Enable **Issues** and **Discussions**.
2. Enable **Private vulnerability reporting** under Security settings.
3. Enable **Dependabot alerts** and **Dependabot security updates**.
4. Enable **Secret scanning** and **Push protection** where available.
5. Confirm the CodeQL workflow is enabled.
6. Add branch protection/ruleset for `main`: require pull requests and require the CI checks before merge.
7. Create labels listed in `docs/LABELS.md`.
8. Repository description: `Free, offline-first, open-source personal finance and financial decision software. Your money. Your computer. Your data.`
9. Suggested topics: `personal-finance`, `budgeting`, `offline-first`, `privacy`, `electron`, `financial-planning`, `money-management`, `debt`, `investments`, `open-source`.
10. Create the first public tag only after CI is green: `v1.0.0`. The installer workflow will publish release artifacts and `SHA256SUMS.txt`.
