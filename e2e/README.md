# E2E tests — autolog.com.ua

Playwright browser tests covering the full app.

## Setup

```bash
npm install         # installs @playwright/test + dotenv
npx playwright install chromium
cp e2e/.env.example .env   # then edit TEST_EMAIL/TEST_PASSWORD
```

## Run

```bash
npm run test:e2e              # headless, all suites
npm run test:e2e:headed       # see the browser
npm run test:e2e:ui           # interactive UI mode (recommended for debugging)
npm run test:e2e:report       # open last HTML report

# Single suite
npx playwright test e2e/garage.spec.js

# Single test
npx playwright test -g "CREATE: add new car"

# Against local dev
BASE_URL=http://localhost:5173 npm run test:e2e
```

## Structure

| File | What it covers |
|---|---|
| `auth.setup.js` | Logs in once, saves session → `_state/auth.json`. Reused by all authenticated suites. |
| `landing.spec.js` | Unauth: homepage, login/register/forgot modals, mobile viewport, console errors. |
| `auth.spec.js` | Login flow, wrong password, logout, bugs #2/#14. |
| `garage.spec.js` | Car CREATE + READ, bug #20a/b (no edit/delete UI). |
| `service.spec.js` | Service CREATE + READ + UPDATE + DELETE (via modal), filter, bug #22 (auto-verified). |
| `booking.spec.js` | Booking CREATE + READ, bugs #24a (no cancel) and #25 (typo "ЗАПРОС"). |
| `ai.spec.js` | AI Mechanic chat, send via Enter, bug #16 (send button disabled). |
| `settings.spec.js` | Profile UPDATE, persistence, bugs #26/#27/#28. |
| `navigation.spec.js` | All 7 authenticated routes, bugs #3/#15 (404 + route aliases). |

## Bug-tracking tests

Tests prefixed with `BUG #N:` document known issues from QA reports. They **intentionally fail**
until the bug is fixed. Once fixed, the test passes — preventing regression.

Bugs referenced:
- #2 — empty login form has no validation
- #3 — 404 routes render landing
- #14 — register accepts unverified emails
- #15 — sidebar URL aliases redirect to /dashboard
- #16 — AI send button stays disabled
- #20a/b — no car edit/delete UI
- #22 — owner-created service auto-marked "Verified"
- #24a — no booking cancel UI
- #25 — "ЗАПРОС" russism (should be "ЗАПИТ")
- #26 — verified badge without real verification
- #27 — no delete-account (GDPR)
- #28 — no Telegram disconnect

## Destructive tests

Tests that create real Firestore data are gated behind `RUN_DESTRUCTIVE_TESTS=1`:

```bash
RUN_DESTRUCTIVE_TESTS=1 npm run test:e2e
```

These tests register new accounts. Clean up manually after.

## Notes

- Tests run **sequentially** (single worker) because they share one test account.
- Storage state cached in `e2e/_state/auth.json` — delete to re-authenticate.
- Reports + traces in `e2e/_report/` + `e2e/_results/`.
- Add `e2e/_state/`, `e2e/_report/`, `e2e/_results/` to `.gitignore` (done).
