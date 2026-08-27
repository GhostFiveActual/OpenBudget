# Architecture

OwnLedger is a Vite/JavaScript application packaged in Electron. The renderer contains the finance UI and calculation engines. State persists locally; backups are explicit JSON exports.

## Trust boundary
The finance renderer is an offline surface. CSP denies connections, Electron blocks non-local requests and external navigation, permissions are denied, and no privileged Node bridge is exposed.

## Compatibility
The OwnLedger storage key is `ownledger:v1`. First load can migrate final OpenBudget development data (`openbudget:v5`) and earlier OpenBudget keys. New backups use `OwnLedgerBackup`; imports also accept `OpenBudgetBackup` and legacy direct-state backups.
