# OpenBudget Security Model

OpenBudget is intentionally designed as an offline personal-finance application.

## Runtime guarantees in the desktop build

- No bank integrations.
- No analytics or telemetry.
- No ads.
- No automatic update checks.
- No remote API calls.
- No embedded web content.
- No external navigation or pop-up windows.
- Renderer `connect-src` is set to `none` with Content Security Policy.
- Electron's `webRequest.onBeforeRequest` cancels non-local requests in production.
- Electron renderer has `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, spellcheck disabled, and webviews disabled.
- The preload script exposes no privileged operating-system APIs.
- Renderer permission requests (camera, microphone, geolocation, notifications, device access, etc.) are denied.
- Production navigation outside the loaded local application is denied.

## Data storage

Financial data is stored locally in the application's browser storage/profile on the user's machine. Users should export backups to storage they control.

OpenBudget does not claim that the local database is independently encrypted at rest. Users who need device-at-rest encryption should enable full-disk encryption such as BitLocker, FileVault, or LUKS and protect the operating-system account with a strong password.

## Backups

Backups are plain JSON so users are never locked into OpenBudget. Because those files can contain sensitive financial information, store them only on encrypted media or in another protected location under your control.

## Email update list

The installed application must never collect email addresses or contact a newsletter/update service. Any optional release-notification signup belongs on the public download website and is operationally separate from OpenBudget financial data.

## Vulnerability reporting

Do not include real financial data in bug reports, screenshots, sample backups, or test fixtures.

## Tax and affordability features

Tax calculation and purchase-affordability analysis execute entirely on-device. Tax jurisdiction data is shipped as static application data and is not refreshed from the network. Purchase plans never query retailers, lenders, credit bureaus, or banks.

The public release-notification mailing list must remain outside the installed application and must never receive, correlate, or derive any OpenBudget financial data.
