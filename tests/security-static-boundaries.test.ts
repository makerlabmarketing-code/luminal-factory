import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repositoryRoot = join(__dirname, '..');
const scannedProductionDirs = ['app', 'component', 'lib', 'services', 'ultis'];

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
});

