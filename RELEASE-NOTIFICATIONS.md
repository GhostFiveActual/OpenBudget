# Release Notification Design

The email list is deliberately separate from the installed OpenBudget application.

## Recommended public website flow

1. User visits the official OpenBudget download page.
2. User downloads the installer directly.
3. Separately, the page offers an optional field: “Email me when a new tested OpenBudget release is available.”
4. Mailing-list provider stores only the email address, consent timestamp, and subscription status.
5. Maintainers send a release notice only after a version has completed testing and has been published.
6. Email links back to the official public release page.

## Do not add to the desktop application

- Newsletter API calls
- Email address collection
- Automatic update checks
- Remote version checks
- Crash reporting
- Analytics
- Usage telemetry
- Device identifiers

This separation allows users to confidently enter sensitive financial information while still having a voluntary way to hear about new releases.
