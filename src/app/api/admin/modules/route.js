import { getAuthUser, requireRole } from '@/lib/auth';
import { getSystemModuleTree, saveSystemModuleTree } from '@/lib/dynamic-engine/moduleRegistry';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']);
  if (denied) return denied;

  try {
    const modules = await getSystemModuleTree();
    return Response.json({ success: true, modules });
  } catch (error) {
    console.error('Error in GET /api/admin/modules:', error);
    return Response.json({ error: 'Modullar yüklənmədi' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { modules, action, updatedModule } = body;

    const result = await saveSystemModuleTree(modules, authUser.email || 'Admin');
    await createConfigurationSnapshot('modules', { modules }, authUser.email || 'Admin', `Modul strukturu yeniləndi (${action || 'Update'})`);

    return Response.json({ success: true, modules: result.modules });
  } catch (error) {
    console.error('Error in POST /api/admin/modules:', error);
    return Response.json({ error: 'Modullar yenilənmədi' }, { status: 500 });
  }
}
