import 'server-only';

import { createClient } from '@/utils/supabase/server';
import { requireAdminEmployee } from '@/services/server/auth';
import {
  getAdminDashboardDtoWithDependencies,
  type DashboardSupabaseClient,
} from '@/services/adminDashboardDataCore';
import type { AdminDashboardDto } from '@/services/adminDashboardDto';

export { DashboardDataError } from '@/services/adminDashboardDataCore';

export async function getAdminDashboardDto(): Promise<AdminDashboardDto> {
  return getAdminDashboardDtoWithDependencies({
    requireAdmin: requireAdminEmployee,
    createDashboardClient: async () => (await createClient()) as unknown as DashboardSupabaseClient,
    now: () => new Date(),
  });
}
