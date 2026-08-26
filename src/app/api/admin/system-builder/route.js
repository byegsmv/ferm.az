import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export const DEFAULT_PAGE_LAYOUTS = [
  {
    pageId: 'page-home',
    name: 'Ana Səhifə',
    slug: '/',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-hero',
        type: 'HERO',
        name: 'Hero Banner & Axtarış',
        columns: 1,
        style: { bg: '#15803d', padding: 'py-12' },
        components: [
          { id: 'c-hero-title', type: 'Heading', props: { text: 'Kənd Təsərrüfatının Rəqəmsal Bazarı', level: 'h1', align: 'center', color: '#ffffff' } },
          { id: 'c-hero-search', type: 'Search', props: { placeholder: 'Toxum, gübrə, texnika və ya məhsul axtarın...', size: 'large' } }
        ]
      },
      {
        id: 'sec-categories',
        type: 'CATEGORIES',
        name: 'Kateqoriyalar Slayderi',
        columns: 1,
        components: [
          { id: 'c-cat-grid', type: 'CategoriesSlider', props: { limit: 12, showIcons: true } }
        ]
      },
      {
        id: 'sec-featured-products',
        type: 'DATA_GRID',
        name: 'Seçilmiş Məhsullar',
        columns: 1,
        components: [
          { id: 'c-products-grid', type: 'ProductList', props: { filter: 'FEATURED', limit: 8, columns: 4 } }
        ]
      },
      {
        id: 'sec-agronomist-banner',
        type: 'CTA_BANNER',
        name: 'AI Aqronom Təşviq Bloku',
        columns: 1,
        components: [
          { id: 'c-ai-banner', type: 'Card', props: { title: 'Süni İntellekt Aqronom', description: 'Bitki xəstəliklərini dərhal diaqnoz edin və düzgün dərmanı seçin', buttonText: 'Aqronoma Yazın', buttonUrl: '/agronom' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-dashboard',
    name: 'Admin Dashboard',
    slug: '/admin',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-kpis',
        type: 'KPIS',
        name: 'Əsas KPI Göstəriciləri',
        columns: 4,
        components: [
          { id: 'c-kpi-rev', type: 'KPICard', props: { title: 'Ümumi Dövriyyə', value: '₼ 24,500', trend: '+14.2%', icon: 'DollarSign', color: 'emerald' } },
          { id: 'c-kpi-orders', type: 'KPICard', props: { title: 'Yeni Sifarişlər', value: '184', trend: '+8.1%', icon: 'ShoppingBag', color: 'blue' } },
          { id: 'c-kpi-users', type: 'KPICard', props: { title: 'Fəal Fermerlər', value: '1,240', trend: '+22.5%', icon: 'Users', color: 'purple' } },
          { id: 'c-kpi-health', type: 'KPICard', props: { title: 'Sistem Statusu', value: '99.9%', trend: 'Stabil', icon: 'Activity', color: 'emerald' } }
        ]
      },
      {
        id: 'sec-charts',
        type: 'CHARTS',
        name: 'Satış & Trafik Qrafikləri',
        columns: 2,
        components: [
          { id: 'c-chart-sales', type: 'LineChart', props: { title: 'Həftəlik Satış Dinamikası', dataSource: 'WEEKLY_SALES' } },
          { id: 'c-chart-orders', type: 'BarChart', props: { title: 'Kateqoriyalar üzrə Sifarişlər', dataSource: 'CATEGORY_ORDERS' } }
        ]
      }
    ]
  }
];

export async function GET(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN', 'MODERATOR']);
  if (denied) return denied;

  try {
    const block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'visual_builder_pages' }
    });

    const pages = (block && block.props && Array.isArray(block.props.pages))
      ? block.props.pages
      : DEFAULT_PAGE_LAYOUTS;

    return Response.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching visual builder pages:', error);
    return Response.json({ success: false, pages: DEFAULT_PAGE_LAYOUTS });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { pages, action, pageId } = body;

    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'visual_builder_pages' }
    });

    const payload = {
      pages,
      updatedAt: new Date().toISOString(),
      updatedBy: authUser.email || authUser.name || 'Admin'
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
          type: 'visual_builder_pages',
          props: payload
        }
      });
    }

    // Save automatic version snapshot
    await createConfigurationSnapshot('builder', payload, authUser.email || 'Admin', `Visual builder səhifələri yeniləndi (${action || 'Save'})`);

    return Response.json({ success: true, pages });
  } catch (error) {
    console.error('Error saving visual builder pages:', error);
    return Response.json({ error: 'Səhifə konfiqurasiyası yadda saxlanılmadı' }, { status: 500 });
  }
}
