import { getAuthUser, requireRole } from '@/lib/auth';
import { getSystemModuleTree, saveSystemModuleTree } from '@/lib/dynamic-engine/moduleRegistry';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']);
  if (denied) return denied;

  try {
    const { prisma } = await import('@/lib/prisma');
    let modules = await getSystemModuleTree();
    
    // Check if any modules were deactivated via Copilot (Settings table)
    const settings = await prisma.setting.findMany({
      where: { key: { endsWith: '_module_active' }, value: 'false' }
    });
    
    if (settings.length > 0) {
      const disabledKeys = settings.map(s => s.key);
      // Helper to recursively disable modules
      const filterModules = (mods) => {
        return mods.filter(m => {
          // If a setting like 'email_module_active' is false, hide the module with id 'sub-emails' or name containing 'E-poçt'
          // Very naive checking for demo purposes based on Copilot's typical keys
          const disableMatch = disabledKeys.some(k => {
             const base = k.replace('_module_active', '').toLowerCase();
             return m.id.toLowerCase().includes(base) || m.name.toLowerCase().includes(base) || (base === 'email' && m.id === 'sub-emails');
          });
          if (disableMatch) return false;
          
          if (m.children) {
            m.children = filterModules(m.children);
          }
          return true;
        });
      };
      
      modules = filterModules(modules);
    }
    
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
