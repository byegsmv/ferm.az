import { getAuthUser, requireRole } from '@/lib/auth';
import { getDynamicPermissions, saveDynamicPermissions, SYSTEM_ROLES, PERMISSION_ACTIONS } from '@/lib/dynamic-engine/permissionEngine';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const data = await getDynamicPermissions();
    return Response.json({
      success: true,
      roles: data.roles || SYSTEM_ROLES,
      actions: PERMISSION_ACTIONS,
      matrix: data.matrix || {},
      fieldPermissions: data.fieldPermissions || {},
      recordRules: data.recordRules || {}
    });
  } catch (error) {
    console.error('Error in GET /api/admin/permissions/engine:', error);
    return Response.json({ error: 'İcazələr yüklənmədi' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = await saveDynamicPermissions(body, authUser.email || 'Admin');
    await createConfigurationSnapshot('rbac', body, authUser.email || 'Admin', 'RBAC və sahə icazələri yeniləndi');

    return Response.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error in POST /api/admin/permissions/engine:', error);
    return Response.json({ error: 'İcazələr yadda saxlanılmadı' }, { status: 500 });
  }
}
