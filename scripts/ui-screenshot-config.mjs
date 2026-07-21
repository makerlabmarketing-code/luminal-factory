export const defaultBaseUrl = 'http://127.0.0.1:3000';
export const defaultOutputDir = '.artifacts/screenshots';
export const defaultReadySelector = 'body';

export const screenshotViewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'mobile', width: 390, height: 844 },
];

export const screenshotRoles = {
  admin: {
    name: 'admin',
    workspacePrefix: '/admin',
    verifyPath: '/admin/dashboard',
    storageState: '.auth/storage-state.admin.json',
    emailEnv: 'UI_TEST_ADMIN_EMAIL',
    passwordEnv: 'UI_TEST_ADMIN_PASSWORD',
  },
  staff: {
    name: 'staff',
    workspacePrefix: '/staff',
    verifyPath: '/staff',
    storageState: '.auth/storage-state.staff.json',
    emailEnv: 'UI_TEST_STAFF_EMAIL',
    passwordEnv: 'UI_TEST_STAFF_PASSWORD',
  },
};

export const safeMutationRoutePatterns = [
  /\/new(?:\/|$)/i,
  /\/edit(?:\/|$)/i,
  /\/create(?:\/|$)/i,
  /\/invite(?:\/|$)/i,
  /\/approve(?:\/|$)/i,
  /\/pay(?:\/|$)/i,
  /\/assign(?:\/|$)/i,
];

export const screenshotRoutes = [
  { name: 'home', path: '/', requiresAuth: false },
  { name: 'no-workspace', path: '/auth/no-workspace', requiresAuth: false },
  { name: 'admin-dashboard', path: '/admin/dashboard', requiresAuth: true, role: 'admin' },
  { name: 'admin-projects', path: '/admin/projects', requiresAuth: true, role: 'admin' },
  { name: 'admin-project-detail', path: '/admin/projects/:projectId', requiresAuth: true, role: 'admin', fixtureEnv: 'UI_SCREENSHOT_ADMIN_PROJECT_ID' },
  { name: 'admin-employees', path: '/admin/employees', requiresAuth: true, role: 'admin' },
  { name: 'admin-accounts', path: '/admin/accounts', requiresAuth: true, role: 'admin' },
  { name: 'staff-dashboard', path: '/staff', requiresAuth: true, role: 'staff' },
  { name: 'staff-attendance', path: '/staff/attendance', requiresAuth: true, role: 'staff' },
  { name: 'staff-tasks', path: '/staff/tasks', requiresAuth: true, role: 'staff' },
];

export function getStorageStatePathForRole(role) {
  return screenshotRoles[role]?.storageState;
}

export function isMutationRoute(path) {
  return safeMutationRoutePatterns.some((pattern) => pattern.test(path));
}

export function resolveRoutePath(route) {
  if (!route.fixtureEnv) return route.path;
  const fixtureValue = process.env[route.fixtureEnv];
  if (!fixtureValue) return undefined;
  return route.path.replace(':projectId', encodeURIComponent(fixtureValue));
}
