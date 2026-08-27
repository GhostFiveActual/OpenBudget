import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.js');
const electron = read('electron/main.cjs');
const vite = read('vite.config.js');
const srcFiles = ['src/main.js','src/engine.js','src/store.js','src/tax-data.js','src/tax-engine.js'].map(read).join('\n');

assert.equal(pkg.version, '3.1.3');
assert.match(index, /connect-src 'none'/, 'CSP must deny renderer network connections');
assert.match(index, /src="\.\/src\/main\.js"/, 'portable source entry should be relative');
assert.doesNotMatch(srcFiles, /https?:\/\//, 'runtime finance source must not contain remote HTTP endpoints');
assert.match(electron, /webRequest\.onBeforeRequest/, 'Electron must install a request blocker');
assert.match(electron, /callback\(\{ cancel: !allowed \}\)/, 'Electron request blocker must cancel disallowed requests');
assert.match(electron, /setPermissionRequestHandler\([^]*callback\(false\)/, 'Electron renderer permissions must be denied');
assert.match(vite, /base:\s*['"]\.\/['"]/, 'Vite production assets must be relative for file:// loading');
assert.match(main, /function decisionResultModal[^]*showModal\(\)/, 'Decision result dialog must be reopened after analysis');
assert.match(main, /isPrimaryPaycheck/, 'Primary-paycheck updates must use an explicit marker');

const ci = read('.github/workflows/ci.yml');
const installers = read('.github/workflows/build-installers.yml');
const e2e = read('tests/e2e_ui.py');
const gitignore = read('.gitignore');
assert.match(ci, /python tests\/e2e_ui\.py/, 'GitHub CI must run the browser E2E suite');
assert.match(ci, /npm run build/, 'GitHub CI must build the production renderer');
assert.match(installers, /npm run dist:win/, 'GitHub installer workflow must build Windows');
assert.match(installers, /npm run dist:mac/, 'GitHub installer workflow must build macOS');
assert.match(installers, /npm run dist:linux/, 'GitHub installer workflow must build Linux');
assert.doesNotMatch(e2e, /\/mnt\/data\/OpenBudget/, 'E2E tests must not depend on the sandbox path');
assert.match(gitignore, /__pycache__\//, 'Repository must ignore Python caches');

console.log('OpenBudget release/security regression tests passed');
