import { getAuthUser, requireRole } from '@/lib/auth';
import { getVersionHistory, rollbackToVersion } from '@/lib/dynamic-engine/versionEngine';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'builder';

  try {
    const history = await getVersionHistory(scope);
    return Response.json({ success: true, scope, history });
  } catch (error) {
    console.error('Error in GET /api/admin/system/versions:', error);
    return Response.json({ error: 'Versiya tarixçəsi yüklənmədi' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { scope, versionId } = body;

    const result = await rollbackToVersion(scope, versionId);
    return Response.json({ success: true, message: `Versiya ${versionId} uğurla bərpa edildi`, result });
  } catch (error) {
    console.error('Error in POST /api/admin/system/versions (rollback):', error);
    return Response.json({ error: error.message || 'Rollback xətası baş verdi' }, { status: 500 });
  }
}
