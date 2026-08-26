import { getAuthUser, requireRole } from '@/lib/auth';
import { checkSystemHealth } from '@/lib/dynamic-engine/systemHealthService';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const health = await checkSystemHealth();
    return Response.json({ success: true, health });
  } catch (error) {
    console.error('Error in GET /api/admin/system/health:', error);
    return Response.json({ error: 'Sistem monitorinq xətası' }, { status: 500 });
  }
}
