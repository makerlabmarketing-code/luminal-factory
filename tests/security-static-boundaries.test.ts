import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repositoryRoot = join(__dirname, '..');
const scannedProductionDirs = ['app', 'component', 'lib', 'services', 'ultis'];
const staffUiDirs = ['app/staff'];

function collectFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return collectFiles(fullPath);
    }

    return [fullPath];
  });
}

describe('static security boundaries', () => {
  it('does not expose service-role credentials in production source paths', () => {
    const files = scannedProductionDirs.flatMap((dir) =>
      collectFiles(join(repositoryRoot, dir))
    );

    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role/i.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('does not explicitly enable public production browser source maps', () => {
    const nextConfigPath = join(repositoryRoot, 'next.config.js');
    const source = existsSync(nextConfigPath)
      ? readFileSync(nextConfigPath, 'utf8')
      : '';

    expect(source).not.toMatch(/productionBrowserSourceMaps\s*:\s*true/);
  });

  it('does not keep the legacy hard-coded admin passcode or browser-readable admin cookie', () => {
    const files = scannedProductionDirs.flatMap((dir) =>
      collectFiles(join(repositoryRoot, dir))
    );

    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /LF2026@|hq_session_token|luminal_secure_encrypted_admin_session_2026/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('does not use URL, localStorage, or sessionStorage staff portal tokens in staff UI', () => {
    const files = staffUiDirs.flatMap((dir) => collectFiles(join(repositoryRoot, dir)));

    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /searchParams\.get\(['"]token['"]\)|current_staff_token|localStorage|sessionStorage|staff\/portal\?token=/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it('keeps sensitive staff mutations behind server-authenticated routes', () => {
    const routeFiles = [
      'app/api/attendance/check-out/route.ts',
      'app/api/staff/attendance/route.ts',
      'app/api/staff/profile/route.ts',
    ];

    routeFiles.forEach((relativePath) => {
      const source = readFileSync(join(repositoryRoot, relativePath), 'utf8');

      expect(source).toMatch(/requireAuthenticatedEmployee/);
      expect(source).not.toMatch(/const\s*\{[^}]*employeeId[^}]*\}\s*=\s*body/);
      expect(source).not.toMatch(/body\.(employeeId|userId|role)/);
    });
  });

  it('does not send staff profile employee identity from the browser', () => {
    const source = readFileSync(
      join(repositoryRoot, 'services/staffProfileService.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/employeeId/);
    expect(source).toMatch(/\/api\/staff\/profile/);
  });

  it('checks admin authorization on the server instead of trusting frontend role state', () => {
    const adminLayout = readFileSync(join(repositoryRoot, 'app/admin/layout.tsx'), 'utf8');
    const adminAuthRoute = readFileSync(join(repositoryRoot, 'app/api/admin/auth/route.ts'), 'utf8');

    expect(adminLayout).toMatch(/getServerAuthContext/);
    expect(adminLayout).toMatch(/hasAdminAccess/);
    expect(adminAuthRoute).toMatch(/requireAdminEmployee/);
    expect(adminAuthRoute).not.toMatch(/passcode/);
  });

  it('does not expose privileged admin credentials through public env names', () => {
    const files = scannedProductionDirs.flatMap((dir) =>
      collectFiles(join(repositoryRoot, dir))
    );

    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /NEXT_PUBLIC_.*(ADMIN|PASS|PASSWORD|SECRET|SERVICE_ROLE)/i.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
