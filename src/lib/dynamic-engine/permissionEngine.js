import { prisma } from '@/lib/prisma';

export const SYSTEM_ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', description: 'Bütün sistemə qeyd-şərtsiz tam giriş', isSystem: true },
  { id: 'ADMIN', name: 'Admin', description: 'Əsas idarəetmə və konfiqurasiya səlahiyyəti', isSystem: true },
  { id: 'MODERATOR', name: 'Moderator', description: 'Məhsul, elan və rəy yoxlanışı', isSystem: true },
  { id: 'FARMER', name: 'Fermer', description: 'Kənd təsərrüfatı istehsalçısı', isSystem: true },
  { id: 'STORE', name: 'Mağaza / Satıcı', description: 'Aqrar mağaza və təchizatçı', isSystem: true },
  { id: 'AGRONOMIST', name: 'Aqronom', description: 'Ekspert məsləhətçi və xidmət təminatçısı', isSystem: true },
  { id: 'BUYER', name: 'Alıcı', description: 'Məhsul sifarişçisi və müştəri', isSystem: true },
  { id: 'DELIVERY_PARTNER', name: 'Kuryer / Çatdırılma', description: 'Logistika və çatdırılma tərəfdaşı', isSystem: true }
];

export const PERMISSION_ACTIONS = [
  { key: 'VIEW', label: 'Baxış (View)', category: 'CRUD' },
  { key: 'CREATE', label: 'Yaratmaq (Create)', category: 'CRUD' },
  { key: 'EDIT', label: 'Düzəliş (Edit)', category: 'CRUD' },
  { key: 'DELETE', label: 'Silmək (Delete)', category: 'CRUD' },
  { key: 'PUBLISH', label: 'Dərc etmək (Publish)', category: 'Workflows' },
  { key: 'APPROVE', label: 'Təsdiqləmək (Approve)', category: 'Workflows' },
  { key: 'EXPORT', label: 'Eksport (Export)', category: 'Data' },
  { key: 'IMPORT', label: 'İmport (Import)', category: 'Data' },
  { key: 'CONFIGURE', label: 'Konfiqurasiya (Configure)', category: 'System' }
];

export async function getDynamicPermissions() {
  try {
    const configBlock = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'dynamic_rbac_permissions' }
    });

    if (configBlock && configBlock.props) {
      return configBlock.props;
    }

    // Default permission matrix
    return {
      roles: SYSTEM_ROLES,
      matrix: {
        SUPER_ADMIN: { all: true },
        ADMIN: {
          products: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'PUBLISH', 'APPROVE', 'EXPORT', 'IMPORT'],
          orders: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'],
          users: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
          settings: ['VIEW', 'EDIT', 'CONFIGURE'],
          builder: ['VIEW', 'EDIT', 'CONFIGURE']
        },
        MODERATOR: {
          products: ['VIEW', 'EDIT', 'APPROVE'],
          orders: ['VIEW'],
          users: ['VIEW']
        },
        STORE: {
          products: ['VIEW', 'CREATE', 'EDIT'],
          orders: ['VIEW', 'EDIT']
        },
        FARMER: {
          products: ['VIEW', 'CREATE', 'EDIT'],
          orders: ['VIEW']
        }
      },
      fieldPermissions: {
        'products.costPrice': { ADMIN: ['VIEW', 'EDIT'], SUPER_ADMIN: ['VIEW', 'EDIT'], MODERATOR: ['HIDDEN'], STORE: ['HIDDEN'] },
        'products.supplierInfo': { ADMIN: ['VIEW', 'EDIT'], SUPER_ADMIN: ['VIEW', 'EDIT'], MODERATOR: ['VIEW'], STORE: ['HIDDEN'] }
      },
      recordRules: {
        STORE: 'OWN_RECORDS',
        FARMER: 'OWN_RECORDS',
        MODERATOR: 'ALL_RECORDS',
        ADMIN: 'ALL_RECORDS',
        SUPER_ADMIN: 'ALL_RECORDS'
      }
    };
  } catch (error) {
    console.error('Error fetching RBAC permissions:', error);
    return { roles: SYSTEM_ROLES, matrix: {}, fieldPermissions: {}, recordRules: {} };
  }
}

export async function saveDynamicPermissions(payload, adminUser = 'SYSTEM') {
  try {
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'dynamic_rbac_permissions' }
    });

    const data = {
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser
    };

    if (block) {
      await prisma.dynamicBlock.update({
        where: { id: block.id },
        data: { props: data }
      });
    } else {
      await prisma.dynamicBlock.create({
        data: {
          page: 'system',
          type: 'dynamic_rbac_permissions',
          props: data
        }
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving RBAC permissions:', error);
    throw error;
  }
}
