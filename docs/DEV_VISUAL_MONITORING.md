# Dev Visual Monitoring and UI Verification

Date: 2026-07-21

## Scope

This is the repository-wide dev-only workflow for observing AI coding sessions and collecting visual evidence for Luminal Factory ERP UI changes.

This workflow preserves production runtime behavior:

- no production code path is changed;
- Playwright is a dev dependency only;
- no Playwright browser binary, token, cookie, or auth state is committed;
- no database schema, RLS, role permission, feature flag, RPC, backfill, deployment, or live data mutation is required.

## Dedicated visual-QA accounts

Authenticated screenshots must use dedicated visual-QA Supabase Auth users only. Do not use owner accounts, employee personal accounts, backup keys, service-role keys, SQL, committed sessions, or any RLS bypass.

Required account properties:

- one `admin` visual-QA account that can open the Admin Workspace read-only pages needed for screenshots;
- one `staff` visual-QA account that can open the Staff Workspace read-only pages needed for screenshots;
- least-privilege permissions for normal UI navigation;
- no operational work should be performed by these accounts during capture.

Codex Cloud secret names:

- `UI_TEST_ADMIN_EMAIL`
- `UI_TEST_ADMIN_PASSWORD`
- `UI_TEST_STAFF_EMAIL`
- `UI_TEST_STAFF_PASSWORD`

The scripts read credentials only from those names and never print credential values, cookies, Supabase access tokens, refresh tokens, authorization headers, or storage-state contents.

## Installation and browser setup

Install normal repository dependencies with npm:

```bash
npm install
```

Install the approved Chromium binary when needed:

```bash
npm run ui:install-browser
```

## Authenticated setup script

Generate local authenticated state by logging in through the real ERP login UI:

```bash
npm run ui:auth:setup -- --role admin
npm run ui:auth:setup -- --role staff
```

Or let the workflow start the dev server:

```bash
npm run ui:auth:setup -- --role admin --start-server
```

Auth state is saved only under:

- `.auth/storage-state.admin.json`
- `.auth/storage-state.staff.json`

The `.auth/` directory is gitignored. Auth state expires like a normal Supabase browser session; regenerate it with `npm run ui:auth:setup -- --role <role>` when screenshots fail with `UI_SCREENSHOT_LOGIN_REDIRECT`, `UI_SCREENSHOT_AUTH_STATE_MISSING`, or access-denied errors.

Delete local auth artifacts after use:

```bash
rm -f .auth/storage-state.admin.json .auth/storage-state.staff.json
rmdir .auth 2>/dev/null || true
```

## Screenshot commands

Use an already running local server:

```bash
npm run dev
npm run ui:screenshot
```

Role-specific authenticated shortcuts:

```bash
npm run ui:screenshot:admin
npm run ui:screenshot:staff
```

Select a safe route and role explicitly:

```bash
npm run ui:screenshot -- --role admin --route /admin/projects
npm run ui:screenshot -- --role staff --route /staff
```

Verification-only mode loads the same routes without writing images:

```bash
npm run ui:verify
npm run ui:verify -- --role admin
```

Useful options and environment variables:

```bash
UI_SCREENSHOT_BASE_URL=http://127.0.0.1:3000 npm run ui:screenshot
UI_SCREENSHOT_DIR=.artifacts/screenshots npm run ui:screenshot
UI_SCREENSHOT_READY_SELECTOR=body npm run ui:screenshot
UI_SCREENSHOT_STORAGE_STATE=.auth/storage-state.admin.json npm run ui:screenshot -- --role admin
UI_SCREENSHOT_ADMIN_PROJECT_ID=123 npm run ui:screenshot:admin
npm run ui:screenshot -- --role admin --route admin-projects --viewport mobile
```

Screenshots are saved under `.artifacts/screenshots/` and are ignored by git.

## Safe route capture

The route list lives in `scripts/ui-screenshot-config.mjs` so tests and the screenshot script share one source of truth.

Default public routes:

- `/`
- `/auth/no-workspace`

Default authenticated Admin routes:

- `/admin/dashboard`
- `/admin/projects`
- `/admin/projects/:projectId` only when `UI_SCREENSHOT_ADMIN_PROJECT_ID` is supplied with an approved read-only fixture ID
- `/admin/employees`
- `/admin/accounts`

Default authenticated Staff routes:

- `/staff`
- `/staff/attendance`
- `/staff/tasks`

Before capturing an authenticated route, the script verifies that the role storage-state file exists, opens the route with normal browser cookies, confirms the app did not redirect to login, confirms the opened workspace matches the requested role, and fails clearly on access-denied content.

Mutation-capable route names and paths containing `/new`, `/edit`, `/create`, `/invite`, `/approve`, `/pay`, or `/assign` are rejected. Screenshot capture must not create, update, delete, assign, approve, pay, invite, or otherwise mutate live data.

## PR evidence workflow

For UI PRs, include:

- whether screenshots were captured in Codex Cloud or locally;
- the command used;
- the base URL;
- the page paths and viewport names captured;
- the session state, such as logged out, admin session, staff session, or permission denied;
- the screenshot filenames from `.artifacts/screenshots/`;
- any limitation such as missing browser package, missing visual-QA credentials, expired auth state, or unavailable local data.

## Codex Cloud status and limitations

Inspection result: no safe checked-in browser auth fixture exists for this repository; generate fresh local-only state with the setup script. After the 2026-07-21 Codex Cloud network allowlist update, Chromium downloaded successfully in this repository.

Browser execution can depend on host Linux packages. If `npm run ui:screenshot` reports `UI_SCREENSHOT_BROWSER_MISSING` after Chromium is installed, install the Playwright host dependencies for the current container or capture screenshots locally with equivalent dependencies available.

When browser setup or execution is unavailable, normal validation must still use `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
