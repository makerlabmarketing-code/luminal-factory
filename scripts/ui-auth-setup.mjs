#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as wait } from 'node:timers/promises';
import { defaultBaseUrl, getStorageStatePathForRole, screenshotRoles } from './ui-screenshot-config.mjs';

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const require = createRequire(import.meta.url);
const baseUrl = process.env.UI_SCREENSHOT_BASE_URL || defaultBaseUrl;
const shouldStartServer = args.has('--start-server');
const selectedRoles = valuesFor('--role');

function valuesFor(flag) {
  return rawArgs.map((arg, index) => (arg === flag ? rawArgs[index + 1] : undefined)).filter(Boolean);
}

function printUsage() {
  console.log(`Dev-only authenticated screenshot setup\n\nUsage:\n  npm run ui:auth:setup\n  npm run ui:auth:setup -- --role admin\n  npm run ui:auth:setup -- --role staff --start-server\n\nRequired secrets:\n  UI_TEST_ADMIN_EMAIL / UI_TEST_ADMIN_PASSWORD\n  UI_TEST_STAFF_EMAIL / UI_TEST_STAFF_PASSWORD\n\nAuth state is written only to .auth/storage-state.<role>.json and must never be committed.`);
}

async function loadPlaywright() {
  try {
    require.resolve('playwright');
  } catch {
    console.error('UI_AUTH_SETUP_TOOL_MISSING: Playwright is not available in devDependencies.');
    process.exit(2);
  }
  return import('playwright');
}

function rolesToSetup() {
  if (!selectedRoles.length) return Object.keys(screenshotRoles);
  const unknown = selectedRoles.filter((role) => !screenshotRoles[role]);
  if (unknown.length) {
    console.error(`UI_AUTH_ROLE_UNKNOWN: Unsupported role(s): ${unknown.join(', ')}`);
    console.error(`Supported roles: ${Object.keys(screenshotRoles).join(', ')}`);
    process.exit(6);
  }
  return selectedRoles;
}

function credentialsForRole(role) {
  const roleConfig = screenshotRoles[role];
  const email = process.env[roleConfig.emailEnv];
  const password = process.env[roleConfig.passwordEnv];
  if (!email || !password) {
    console.error(`UI_AUTH_CREDENTIALS_MISSING: Missing required ${role} visual-QA credentials.`);
    console.error(`Provide ${roleConfig.emailEnv} and ${roleConfig.passwordEnv} as secure local or Codex Cloud secrets.`);
    process.exit(5);
  }
  return { email, password };
}

async function waitForServer(url) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch {}
    await wait(750);
  }
  console.error(`UI_AUTH_SERVER_UNAVAILABLE: No app server responded at ${url}.`);
  process.exit(3);
}

async function assertRoleWorkspace(page, role) {
  const roleConfig = screenshotRoles[role];
  await page.goto(new URL(roleConfig.verifyPath, baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
  const currentPath = new URL(page.url()).pathname;
  if (currentPath.startsWith('/admin') && role === 'admin') return;
  if (currentPath.startsWith('/staff') && role === 'staff') return;
  if (currentPath.startsWith('/admin') || currentPath.startsWith('/staff')) return;
  throw new Error(`UI_AUTH_ROLE_VERIFY_FAILED: ${role} account did not open ${roleConfig.verifyPath}.`);
}

async function setupRole(browser, role) {
  const { email, password } = credentialsForRole(role);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(new URL('/admin', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Mật khẩu').fill(password);
  await page.getByRole('button', { name: /^Đăng nhập|Đang đăng nhập/ }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/admin') || url.pathname !== '/admin', { timeout: 30_000 }).catch(() => undefined);
  await assertRoleWorkspace(page, role);
  await mkdir('.auth', { recursive: true });
  await context.storageState({ path: getStorageStatePathForRole(role) });
  await context.close();
  console.log(`Created authenticated ${role} storage state at ${getStorageStatePathForRole(role)}.`);
}

async function main() {
  if (args.has('--help')) {
    printUsage();
    return;
  }
  const playwright = await loadPlaywright();
  let devServer;
  let browser;
  if (shouldStartServer) {
    devServer = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32', env: process.env });
  }
  try {
    await waitForServer(baseUrl);
    browser = await playwright.chromium.launch();
    for (const role of rolesToSetup()) await setupRole(browser, role);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`UI_AUTH_SETUP_FAILED: ${message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    if (devServer) devServer.kill('SIGTERM');
  }
}

main();
