import { prisma } from '@/lib/prisma';

export async function createConfigurationSnapshot(scope, configData, authorName = 'Admin', description = '') {
  try {
    const timestamp = new Date().toISOString();
    const versionId = `v-${Date.now()}`;

    // Get previous versions
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: `version_history_${scope}` }
    });

    const history = block?.props?.history || [];

    const newEntry = {
      versionId,
      timestamp,
      author: authorName,
      description: description || `${scope} üçün konfiqurasiya yenilənməsi`,
      snapshot: configData
    };

    // Keep last 30 versions
    const updatedHistory = [newEntry, ...history].slice(0, 30);

    if (block) {
      await prisma.dynamicBlock.update({
        where: { id: block.id },
        data: {
          props: {
            history: updatedHistory,
            currentVersion: versionId,
            updatedAt: timestamp
          }
        }
      });
    } else {
      await prisma.dynamicBlock.create({
        data: {
          page: 'system',
          type: `version_history_${scope}`,
          props: {
            history: updatedHistory,
            currentVersion: versionId,
            updatedAt: timestamp
          }
        }
      });
    }

    return { success: true, versionId, timestamp };
  } catch (error) {
    console.error('Error creating snapshot:', error);
    throw error;
  }
}

export async function getVersionHistory(scope) {
  try {
    const block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: `version_history_${scope}` }
    });

    return block?.props?.history || [];
  } catch (error) {
    console.error('Error fetching version history:', error);
    return [];
  }
}

export async function rollbackToVersion(scope, versionId) {
  try {
    const history = await getVersionHistory(scope);
    const target = history.find(h => h.versionId === versionId);

    if (!target) {
      throw new Error(`Version ${versionId} tapılmadı`);
    }

    // Apply target snapshot back to target dynamic block
    let targetBlockType = '';
    if (scope === 'modules') targetBlockType = 'module_hierarchy_tree';
    else if (scope === 'rbac') targetBlockType = 'dynamic_rbac_permissions';
    else if (scope === 'workflows') targetBlockType = 'system_workflows_engine';
    else if (scope === 'builder') targetBlockType = 'visual_builder_pages';
    else targetBlockType = `admin_config_${scope}`;

    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: targetBlockType }
    });

    if (block) {
      await prisma.dynamicBlock.update({
        where: { id: block.id },
        data: { props: target.snapshot }
      });
    } else {
      await prisma.dynamicBlock.create({
        data: {
          page: 'system',
          type: targetBlockType,
          props: target.snapshot
        }
      });
    }

    // Record rollback event
    await createConfigurationSnapshot(scope, target.snapshot, 'SYSTEM (Rollback)', `Rollback to ${versionId}`);

    return { success: true, restoredSnapshot: target.snapshot };
  } catch (error) {
    console.error('Error executing rollback:', error);
    throw error;
  }
}
