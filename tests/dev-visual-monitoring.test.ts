import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('dev visual monitoring documentation and tooling', () => {
  it('keeps Playwright dev-only and documents approved screenshot workflow', () => {
    const docs = source('docs/DEV_VISUAL_MONITORING.md');
    const pkg = JSON.parse(source('package.json')) as { scripts: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const gitignore = source('.gitignore');

    expect(docs).toMatch(/Playwright is a dev dependency only/);
    expect(docs).toMatch(/npm run ui:install-browser/);
    expect(docs).toMatch(/UI_SCREENSHOT_STORAGE_STATE/);
    expect(docs).toMatch(/no safe checked-in browser auth fixture exists/);
    expect(docs).toMatch(/network allowlist update/);
    expect(docs).toMatch(/UI_SCREENSHOT_BROWSER_MISSING/);
    expect(docs).toMatch(/\.artifacts\/screenshots/);
    expect(pkg.scripts['ui:screenshot']).toBe('node scripts/ui-screenshot.mjs');
    expect(pkg.scripts['ui:verify']).toBe('node scripts/ui-screenshot.mjs --verify');
    expect(pkg.scripts['ui:install-browser']).toBe('playwright install chromium');
    expect(pkg.dependencies?.playwright).toBeUndefined();
    expect(pkg.dependencies?.cypress).toBeUndefined();
    expect(pkg.devDependencies?.playwright).toBeDefined();
    expect(pkg.devDependencies?.cypress).toBeUndefined();
    expect(gitignore).toMatch(/\.artifacts\//);
    expect(gitignore).toMatch(/playwright-report\//);
    expect(gitignore).toMatch(/\.auth\//);
  });

  it('shares route and viewport configuration with the screenshot script', () => {
    const config = source('scripts/ui-screenshot-config.mjs');
    const script = source('scripts/ui-screenshot.mjs');

    expect(config).toMatch(/screenshotRoutes/);
    expect(config).toMatch(/requiresAuth: true/);
    expect(config).toMatch(/admin-projects/);
    expect(config).toMatch(/staff-tasks/);
    expect(config).toMatch(/desktop/);
    expect(config).toMatch(/mobile/);
    expect(script).toMatch(/UI_SCREENSHOT_BASE_URL/);
    expect(script).toMatch(/UI_SCREENSHOT_AUTH_REQUIRED/);
    expect(script).toMatch(/UI_SCREENSHOT_STORAGE_STATE/);
    expect(script).toMatch(/UI_SCREENSHOT_BROWSER_MISSING/);
  });
});

describe('authenticated visual QA screenshot workflow', () => {
  it('defines independent admin and staff roles with dedicated secret names and auth-state files', async () => {
    const config = await import('../scripts/ui-screenshot-config.mjs');
    const pkg = JSON.parse(source('package.json')) as { scripts: Record<string, string> };

    expect(config.screenshotRoles.admin.emailEnv).toBe('UI_TEST_ADMIN_EMAIL');
    expect(config.screenshotRoles.admin.passwordEnv).toBe('UI_TEST_ADMIN_PASSWORD');
    expect(config.screenshotRoles.staff.emailEnv).toBe('UI_TEST_STAFF_EMAIL');
    expect(config.screenshotRoles.staff.passwordEnv).toBe('UI_TEST_STAFF_PASSWORD');
    expect(config.getStorageStatePathForRole('admin')).toBe('.auth/storage-state.admin.json');
    expect(config.getStorageStatePathForRole('staff')).toBe('.auth/storage-state.staff.json');
    expect(pkg.scripts['ui:auth:setup']).toBe('node scripts/ui-auth-setup.mjs');
    expect(pkg.scripts['ui:screenshot:admin']).toBe('node scripts/ui-screenshot.mjs --role admin');
    expect(pkg.scripts['ui:screenshot:staff']).toBe('node scripts/ui-screenshot.mjs --role staff');
  });

  it('requires storage-state before authenticated capture and detects login redirects/access denial', () => {
    const script = source('scripts/ui-screenshot.mjs');

    expect(script).toMatch(/ensureStorageStateForRole/);
    expect(script).toMatch(/UI_SCREENSHOT_AUTH_STATE_MISSING/);
    expect(script).toMatch(/UI_SCREENSHOT_LOGIN_REDIRECT/);
    expect(script).toMatch(/UI_SCREENSHOT_ACCESS_DENIED/);
    expect(script).toMatch(/UI_SCREENSHOT_ROLE_MISMATCH/);
    expect(script).not.toMatch(/console\.log\([^)]*storageState\)/);
  });

  it('keeps auth artifacts ignored and rejects mutation-capable routes', async () => {
    const config = await import('../scripts/ui-screenshot-config.mjs');
    const gitignore = source('.gitignore');

    expect(gitignore).toMatch(/^\.auth\/$/m);
    expect(config.isMutationRoute('/admin/projects/new')).toBe(true);
    expect(config.isMutationRoute('/admin/projects/123/edit')).toBe(true);
    expect(config.isMutationRoute('/admin/accounts/invite')).toBe(true);
    expect(config.isMutationRoute('/admin/projects')).toBe(false);
    expect(config.isMutationRoute('/staff/tasks')).toBe(false);
  });

  it('documents safe authenticated setup and expiry regeneration', () => {
    const docs = source('docs/DEV_VISUAL_MONITORING.md');

    expect(docs).toMatch(/dedicated visual-QA Supabase Auth users only/);
    expect(docs).toMatch(/UI_TEST_ADMIN_EMAIL/);
    expect(docs).toMatch(/UI_TEST_STAFF_PASSWORD/);
    expect(docs).toMatch(/npm run ui:auth:setup -- --role admin/);
    expect(docs).toMatch(/Auth state expires like a normal Supabase browser session/);
    expect(docs).toMatch(/rm -f \.auth\/storage-state\.admin\.json \.auth\/storage-state\.staff\.json/);
    expect(docs).toMatch(/Mutation-capable route names and paths/);
  });
});
