import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repositoryRoot = join(__dirname, '..');

function source(relativePath: string): string {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

describe('project duplicate check and error mapping', () => {
  it('checks duplicates with a 0-row-safe array query', () => {
    const service = source('services/server/projectMutations.ts');

    expect(service).toMatch(/\.from\('projects'\)\s*\.select\('id'\)\s*\.ilike\('project_name', projectName\)\s*\.limit\(1\)/);
    expect(service).not.toMatch(/\.eq\('project_name', projectName\)\s*\.maybeSingle\(\)/);
    expect(service).not.toMatch(/\.eq\('project_name', projectName\)\s*\.single\(\)/);
    expect(service).toMatch(/const existingProject = existingProjects\?\.\[0\]/);
  });

  it('maps duplicate outcomes to the expected API contract', () => {
    const service = source('services/server/projectMutations.ts');
    const route = source('app/api/admin/projects/route.ts');

    expect(service).toMatch(/status: 409,\s*message: 'Dự án đã tồn tại\.',\s*failureStage: 'duplicate_check',\s*code: 'project_already_exists'/);
    expect(service).toMatch(/status: 500,\s*message: 'Không thể kiểm tra dự án hiện có\.',\s*failureStage: 'duplicate_check',\s*code: 'project_duplicate_check_failed'/);
    expect(service).toMatch(/failureStage: 'project_insert',\s*code: 'project_insert_failed'/);
    expect(route).toMatch(/jsonNoStore\(await createProject\(body\), \{ status: 201 \}\)/);
  });

  it('trims names and inserts only live project columns', () => {
    const service = source('services/server/projectMutations.ts');
    const repository = source('services/repositories/workflowRepository.ts');

    expect(service).toMatch(/const trimmed = value\.trim\(\)/);
    expect(repository).toMatch(/projectName: params\.projectName\.trim\(\)/);
    expect(service).toMatch(/insert\(\[\{ project_name: projectName, status, drive_url: '' \}\]\)/);
  });

  it('keeps project create UI messages distinct from phase create messages', () => {
    const taskPage = source('app/admin/tasks/page.tsx');
    const projectPage = source('app/admin/projects/page.tsx');

    for (const page of [taskPage, projectPage]) {
      expect(page).toMatch(/Dự án này đã tồn tại\./);
      expect(page).toMatch(/Bạn không có quyền tạo dự án\./);
      expect(page).toMatch(/Thông tin dự án chưa hợp lệ\./);
      expect(page).toMatch(/Không thể tạo dự án\./);
      expect(page).toMatch(/Không thể lưu giai đoạn\./);
    }
  });

  it('keeps browser project mutations out of the workflow repository', () => {
    const repository = source('services/repositories/workflowRepository.ts');

    expect(repository).not.toMatch(/from\('projects'\)\.insert/);
    expect(repository).not.toMatch(/from\('projects'\)\.update/);
    expect(repository).not.toMatch(/from\('projects'\)\.delete/);
    expect(repository).toMatch(/\/api\/admin\/projects/);
  });
});
