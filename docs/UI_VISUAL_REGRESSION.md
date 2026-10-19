# UI visual regression

Playwright is not a dependency of this repository, and a browser binary was not installed for this pass. Screenshot baselines at 1920, 1440, 1280, 1024, 768, 390, and 375 were not captured. This check is not a pass.

What was checked instead:

- HTTP 200 for the ten production routes on commit `9820331`.
- Asset paths were `/_next/…`.
- `npx tsc --noEmit --incremental false` passed after the UI edits.
- `npm test` passed 59 tests and skipped 3 live RPC tests.

Horizontal overflow, open menus, and mobile sidebar collisions were not measured with screenshots in this pass.
