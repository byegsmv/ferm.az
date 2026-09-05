import { prisma } from '@/lib/prisma';

export const DEFAULT_MODULE_TREE = [
  {
    id: 'mod-dashboard',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    slug: '/admin',
    description: 'Sistem göstəriciləri və ümumi baxış paneli',
    status: 'ACTIVE',
    visibility: 'ALL',
    permission: 'VIEW_DASHBOARD',
    isSystem: true,
    children: []
  },
  {
    id: 'mod-builder',
    name: 'Visual System Builder',
    icon: 'Wand2',
    slug: '/admin/builder',
    description: 'Bütün sistemi vizual Drag & Drop ilə idarə etmə kətanı',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'MANAGE_BUILDER',
    isSystem: true,
    badge: 'PRO',
    children: []
  },
  {
    id: 'mod-products',
    name: 'Məhsullar & Kataloq',
    icon: 'Package',
    slug: '/admin/products',
    description: 'Məhsul və kataloq idarəetməsi',
    status: 'ACTIVE',
    visibility: 'ALL',
    permission: 'MANAGE_PRODUCTS',
    isSystem: true,
    children: [
      { id: 'sub-all-products', name: 'Bütün Məhsullar', icon: 'List', slug: '/admin/products', status: 'ACTIVE' },
      { id: 'sub-bulk-upload', name: 'Toplu Yükləmə', icon: 'UploadCloud', slug: '/admin?tab=bulkUpload', status: 'ACTIVE' },
      { id: 'sub-categories', name: 'Kateqoriyalar', icon: 'FolderTree', slug: '/admin/categories', status: 'ACTIVE' },
      { id: 'sub-brands', name: 'Brendlər', icon: 'Tag', slug: '/admin/brands', status: 'ACTIVE' },
      { id: 'sub-ingredients', name: 'Aktiv Maddələr', icon: 'FlaskConical', slug: '/admin/active-ingredients', status: 'ACTIVE' },
      { id: 'sub-crops', name: 'Bitkilər', icon: 'Sprout', slug: '/admin/crops', status: 'ACTIVE' },
      { id: 'sub-diseases', name: 'Xəstəliklər', icon: 'ShieldAlert', slug: '/admin/diseases', status: 'ACTIVE' },
      { id: 'sub-pests', name: 'Zərərvericilər', icon: 'Bug', slug: '/admin/pests', status: 'ACTIVE' }
    ]
  },
  {
    id: 'mod-orders',
    name: 'Sifarişlər & Ödənişlər',
    icon: 'ShoppingCart',
    slug: '/admin/orders',
    description: 'Sifarişlər, çatdırılma və maliyyə əməliyyatları',
    status: 'ACTIVE',
    visibility: 'ALL',
    permission: 'MANAGE_ORDERS',
    isSystem: true,
    children: [
      { id: 'sub-orders-all', name: 'Bütün Sifarişlər', icon: 'Receipt', slug: '/admin/orders', status: 'ACTIVE' },
      { id: 'sub-coupons', name: 'Kuponlar & Endirimlər', icon: 'Percent', slug: '/admin/coupons', status: 'ACTIVE' }
    ]
  },
  {
    id: 'mod-marketing',
    name: 'Marketinq & Kampaniyalar',
    icon: 'Megaphone',
    slug: '/admin/campaigns',
    description: 'Reklam kampaniyaları və bannerlər',
    status: 'ACTIVE',
    visibility: 'ALL',
    permission: 'MANAGE_MARKETING',
    isSystem: true,
    children: [
      { id: 'sub-campaigns', name: 'Kampaniyalar', icon: 'Sparkles', slug: '/admin/campaigns', status: 'ACTIVE' },
      { id: 'sub-banners', name: 'Bannerlər', icon: 'Image', slug: '/admin/banners', status: 'ACTIVE' }
    ]
  },
  {
    id: 'mod-users',
    name: 'İstifadəçilər & Rollar',
    icon: 'Users',
    slug: '/admin/users',
    description: 'Fermerlər, mağazalar, aqronomlar və istifadəçilər',
    status: 'ACTIVE',
    visibility: 'ALL',
    permission: 'MANAGE_USERS',
    isSystem: true,
    children: [
      { id: 'sub-users-all', name: 'Bütün İstifadəçilər', icon: 'UserCheck', slug: '/admin/users', status: 'ACTIVE' },
      { id: 'sub-roles-perm', name: 'Rollar & İcazələr', icon: 'Shield', slug: '/admin/permissions', status: 'ACTIVE' }
    ]
  },
  {
    id: 'mod-workflows',
    name: 'Workflows & Avtomatlaşdırma',
    icon: 'GitBranch',
    slug: '/admin/workflows',
    description: 'Vizual status axınları və trigger qaydaları',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'MANAGE_WORKFLOWS',
    isSystem: true,
    badge: 'NEW',
    children: []
  },
  {
    id: 'mod-health',
    name: 'Sistem Sağlamlığı',
    icon: 'Activity',
    slug: '/admin/health',
    description: 'Verilənlər bazası, API və inteqrasiyaların real-vaxt monitoru',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'VIEW_SYSTEM_HEALTH',
    isSystem: true,
    children: []
  },
  {
    id: 'mod-settings',
    name: 'Sistem Tənzimləmələri',
    icon: 'Settings',
    slug: '/admin/settings',
    description: 'Qlobal konfiqurasiya, tərcümələr və inteqrasiyalar',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'MANAGE_SETTINGS',
    isSystem: true,
    children: [
      { id: 'sub-general-settings', name: 'Ümumi Tənzimləmələr', icon: 'Sliders', slug: '/admin/settings', status: 'ACTIVE' },
      { id: 'sub-translations', name: 'Dillər & Tərcümələr', icon: 'Globe', slug: '/admin/translations', status: 'ACTIVE' },
      { id: 'sub-modules-toggle', name: 'Modul Açarları', icon: 'ToggleLeft', slug: '/admin/modules', status: 'ACTIVE' }
    ]
  },
  {
    id: 'mod-extra',
    name: 'Əlavə Modullar',
    icon: 'Layers',
    slug: '/admin?tab=site-texts',
    description: 'Analitika və digər xüsusi alətlər',
    status: 'ACTIVE',
    visibility: 'ADMIN',
    permission: 'MANAGE_SETTINGS',
    isSystem: true,
    children: [
      { id: 'sub-site-texts', name: 'Məzmun İdarəsi', icon: 'FileText', slug: '/admin?tab=site-texts', status: 'ACTIVE' },
      { id: 'sub-slider', name: 'Slayderlər', icon: 'Image', slug: '/admin?tab=slider', status: 'ACTIVE' },
      { id: 'sub-notify', name: 'Bildirişlər', icon: 'Bell', slug: '/admin?tab=notify', status: 'ACTIVE' },
      { id: 'sub-adslots', name: 'Reklam Yerləri', icon: 'MonitorPlay', slug: '/admin?tab=adslots', status: 'ACTIVE' },
      { id: 'sub-analytics', name: 'Analitika', icon: 'LineChart', slug: '/admin?tab=analytics', status: 'ACTIVE' }
    ]
  }
];

export async function getSystemModuleTree() {
  try {
    const configBlock = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'module_hierarchy_tree' }
    });

    if (configBlock && configBlock.props && Array.isArray(configBlock.props.modules)) {
      return configBlock.props.modules;
    }
    return DEFAULT_MODULE_TREE;
  } catch (error) {
    console.error('Error fetching module tree:', error);
    return DEFAULT_MODULE_TREE;
  }
}

export async function saveSystemModuleTree(modules, adminUser = 'SYSTEM') {
  try {
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'module_hierarchy_tree' }
    });

    const payload = {
      modules,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser
    };

    if (block) {
      await prisma.dynamicBlock.update({
        where: { id: block.id },
        data: { props: payload }
      });
    } else {
      await prisma.dynamicBlock.create({
        data: {
          page: 'system',
          type: 'module_hierarchy_tree',
          props: payload
        }
      });
    }

    return { success: true, modules };
  } catch (error) {
    console.error('Error saving module tree:', error);
    throw error;
  }
}
