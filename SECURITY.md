# OwnLedger Security Policy

OwnLedger is intentionally designed as an offline personal-finance application. Financial information should remain on the user's device unless the user explicitly exports a backup.

## Core properties
- No bank connections, telemetry, analytics, ads, or cloud financial account
- Renderer CSP includes `connect-src 'none'`
- Electron blocks non-local network requests, external navigation, popups, and permission requests
- Node integration is disabled for the finance renderer
- Backups are user-initiated and portable

## At-rest protection
OwnLedger 1.0 does not claim independent application-level encryption at rest. Use full-disk encryption such as BitLocker, FileVault, or LUKS and a strong OS account password. Exported JSON backups can contain sensitive financial information.

## Reporting a vulnerability
Do **not** create a public GitHub Issue for vulnerabilities that could expose, corrupt, modify, or destroy financial information or bypass the offline boundary. Use GitHub private vulnerability reporting when available. Include affected version/platform, reproduction steps, impact, and suggested mitigation.

## Supported versions
Security fixes target the latest release. Users manually obtain tested releases from GitHub Releases; the installed application does not phone home for updates.
