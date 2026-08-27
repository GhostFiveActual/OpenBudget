# Development

Requires a current Node.js/npm environment. Python plus Playwright/Chromium are used by the browser E2E suite.

```bash
npm install
npm test
npm run build
```

Use `npm run dev` for Vite. Packaging commands: `npm run dist:win`, `npm run dist:mac`, `npm run dist:linux`. Do not add runtime network behavior without approved architecture discussion.
