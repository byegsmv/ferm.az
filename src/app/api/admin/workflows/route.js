import { getAuthUser, requireRole } from '@/lib/auth';
import { getSystemWorkflows, saveSystemWorkflows } from '@/lib/dynamic-engine/workflowEngine';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const workflows = await getSystemWorkflows();
    return Response.json({ success: true, workflows });
  } catch (error) {
    console.error('Error in GET /api/admin/workflows:', error);
    return Response.json({ error: 'Workflows yüklənmədi' }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { workflows } = body;

    const result = await saveSystemWorkflows(workflows, authUser.email || 'Admin');
    await createConfigurationSnapshot('workflows', { workflows }, authUser.email || 'Admin', 'İş axınları və avtomatlaşdırmalar yeniləndi');

    return Response.json({ success: true, workflows: result.workflows });
  } catch (error) {
    console.error('Error in POST /api/admin/workflows:', error);
    return Response.json({ error: 'Workflows yadda saxlanılmadı' }, { status: 500 });
  }
}
