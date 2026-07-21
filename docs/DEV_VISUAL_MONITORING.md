# Dev Visual Monitoring and UI Verification

Date: 2026-07-21

## Scope

This is the repository-wide dev-only workflow for observing AI coding sessions and collecting visual evidence for Luminal Factory ERP UI changes.

This workflow preserves production runtime behavior:

- no production code path is changed;
- no application dependency is added;
- no Playwright, Cypress, browser binary, token, cookie, or auth state is committed;
- no database schema, RLS, role permission, feature flag, RPC, backfill, deployment, or live data mutation is required.

## Repository inspection result

Current tooling found before this workflow was added:

- `package.json` uses npm scripts for `dev`, `test`, `lint`, and `build`.
- Tests are Vitest-based under `tests/`.
- No README file exists in the repository root.
- Existing docs are under `docs/` and do not define a screenshot/browser automation workflow.
- No Playwright or Cypress dependency is declared in `package.json`.
- `package-lock.json` mentions Vitest optional browser metadata, but this is not an installed repository screenshot workflow.
- No existing screenshot, video, trace, or browser automation script was found.
- `.gitignore` now excludes local monitoring artifacts, browser traces, videos, and temporary auth state.

## Agent Eye and local dashboard suitability

Agent Eye was investigated as a requested category, but this repository should not assume it is installed or required.

As of 2026-07-21, the closest public match found during inspection was `coding-by-feng/ai-agent-session-center`, published recently in search results and described as a local dashboard for Claude Code, Gemini CLI, and Codex sessions. Its README describes local terminals, transcripts, tool logs, and queues. This is enough to treat it as potentially suitable for local operator monitoring, but not enough to make it a repository dependency without approval.

Observed suitability rules for this repository:

- Prefer built-in Codex task logs for Codex Cloud because cloud tasks already expose command output, diffs, and validation logs to the operator.
- A local dashboard can be useful for local CLI sessions if it is actively maintained, works locally, and is reversible.
- Do not add a dashboard dependency to this repository unless the team approves the exact tool and security model.
- Do not install a tool that requires paid hosting, cloud-only accounts, checked-in tokens, broad filesystem hooks, or persistent auth state in the repo.
- If a dashboard uses hooks into local agent CLIs, review what files it changes, where logs are stored, and whether sensitive prompts or terminal output leave the machine.

A suitable local option is any dashboard that:

- runs on localhost;
- supports Codex CLI or the local agent actually used by the operator;
- is actively maintained at the time of adoption;
- can be uninstalled cleanly;
- stores logs outside the repository or under ignored local artifacts;
- does not require cloud services for normal monitoring.

`ai-agent-session-center` is an example of the category: its public README describes a localhost dashboard for Claude Code, Gemini, and Codex sessions, an `npx` startup flow, reversible hooks, and local-only message queues. Treat it as an operator-owned local tool, not a repository dependency.

## Approved lightweight workflow

For all Codex Cloud tasks:

1. Use the Codex task log as the primary monitoring surface.
2. Keep validation output in the PR summary.
3. Use screenshots only when a UI change is visible and browser tooling is available.
4. If screenshots cannot be captured in Codex Cloud, report the missing browser tooling and provide local commands.

For local development:

1. Run the ERP dev server:

   ```bash
   npm run dev
   ```

2. Open the app locally, usually at:

   ```text
   http://127.0.0.1:3000
   ```

3. Optionally open a local agent dashboard after reviewing its maintenance status, hook behavior, and data storage.
4. Capture screenshots manually or with an approved browser tool.
5. Save evidence under:

   ```text
   .artifacts/screenshots/
   ```

6. Attach selected screenshots to the PR; do not commit them.

## Screenshot capture status

Current status: `TOOLING_APPROVAL_REQUIRED` before adding Playwright, Cypress, or browser binaries.

Because this repository does not currently include Playwright or Cypress, no `ui:screenshot` or `ui:verify` npm script is registered yet. Adding scripts that call missing browser tooling would create a false workflow.

## Minimal browser setup proposal after approval

If the team approves Playwright as dev-only tooling, use the minimal setup below:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

Then add a repository script that:

- starts or assumes `npm run dev`;
- fails clearly if the local server is unavailable;
- fails clearly if Chromium or host browser dependencies are missing;
- supports `UI_SCREENSHOT_BASE_URL`;
- captures only approved key pages;
- avoids live data mutation;
- writes screenshots to `.artifacts/screenshots/`.

Do not add Playwright to production dependencies.

## Approved key pages for future automation

Future automation may target only pages that are safe in the current local session:

- `/`
- `/auth/no-workspace`
- `/admin/projects` only when the operator already has a safe local admin session;
- `/admin/projects/1` only when the operator already has a safe local admin session and the record exists locally;
- `/staff/tasks` only when the operator already has a safe local staff session.

Authenticated pages require an operator-provided safe local session. Do not hardcode credentials, store cookies or tokens in Git, bypass authentication, or mutate live data to create a screenshot state.

## Auth fixture inspection result

No safe checked-in browser auth fixture was found for UI screenshot automation.

Until an approved auth fixture exists:

- do not automate login with hardcoded credentials;
- do not commit storage state, cookies, tokens, passwords, or Supabase session data;
- limit automation to public pages or pages reachable through the operator's existing local browser session;
- document the session state used when attaching screenshots.

## Codex Cloud limitations

Codex Cloud may not provide installed browser automation packages or browser binaries. In that case:

- normal validation must still use `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`;
- screenshot capture remains a local evidence step;
- report `TOOLING_APPROVAL_REQUIRED` rather than failing the implementation for missing Playwright/Cypress;
- do not install heavy browser dependencies without explicit approval.

## PR evidence checklist

For UI PRs, include:

- whether screenshots were captured in Codex Cloud or locally;
- the browser/tool used;
- the base URL;
- the page paths captured;
- the session state, such as logged out, admin session, staff session, or permission denied;
- the screenshot filenames from `.artifacts/screenshots/`;
- any limitation such as missing browser package, missing browser binary, missing auth fixture, or unavailable local data.
