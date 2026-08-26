import { prisma } from '@/lib/prisma';
import { getAuthUser, requireRole } from '@/lib/auth';
import { createConfigurationSnapshot } from '@/lib/dynamic-engine/versionEngine';

export const ALL_SYSTEM_PAGES = [
  {
    pageId: 'page-home',
    name: 'Ana Səhifə',
    slug: '/',
    module: 'MARKETPLACE',
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
        name: 'Seçilmiş Məhsullar & Elanlar',
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
    module: 'ADMIN_CORE',
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
  },
  {
    pageId: 'page-products',
    name: 'Məhsullar & Kataloq',
    slug: '/products',
    module: 'PRODUCTS',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-prod-header',
        type: 'HEADER',
        name: 'Kataloq Başlığı & Filtrlər',
        columns: 1,
        components: [
          { id: 'c-prod-title', type: 'Heading', props: { text: 'Aqrar Məhsullar Kataloqu', level: 'h2' } }
        ]
      },
      {
        id: 'sec-prod-grid',
        type: 'DATA_GRID',
        name: 'Məhsul Siyahısı Cədvəli',
        columns: 1,
        components: [
          { id: 'c-all-products-grid', type: 'ProductList', props: { limit: 16, columns: 4, filter: 'ACTIVE' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-categories',
    name: 'Kateqoriyalar',
    slug: '/categories',
    module: 'PRODUCTS',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-cat-all',
        type: 'GRID',
        name: 'Bütün Kateqoriyalar Şəbəkəsi',
        columns: 3,
        components: [
          { id: 'c-cat-card-1', type: 'Card', props: { title: 'Toxumlar & Tinglər', description: 'Tərəvəz, taxıl və meyvə tingləri' } },
          { id: 'c-cat-card-2', type: 'Card', props: { title: 'Gübrələr & Bitki Qidaları', description: 'Mineral, üzvi və bio gübrələr' } },
          { id: 'c-cat-card-3', type: 'Card', props: { title: 'Dərmanlar (Pestisidlər)', description: 'Funqisid, insektisid və herbisidlər' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-brands',
    name: 'Brendlər & İstehsalçılar',
    slug: '/brands',
    module: 'PRODUCTS',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-brands-grid',
        type: 'GRID',
        name: 'Partnyor Brendlər',
        columns: 4,
        components: [
          { id: 'c-brand-1', type: 'Card', props: { title: 'Bayer Crop Science', description: 'Almaniya' } },
          { id: 'c-brand-2', type: 'Card', props: { title: 'Syngenta', description: 'İsveçrə' } },
          { id: 'c-brand-3', type: 'Card', props: { title: 'BASF Agro', description: 'Almaniya' } },
          { id: 'c-brand-4', type: 'Card', props: { title: 'Yara International', description: 'Norveç' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-orders',
    name: 'Sifarişlər & Maliyyə',
    slug: '/admin/orders',
    module: 'ORDERS',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-orders-kpi',
        type: 'KPIS',
        name: 'Sifariş İcmalı',
        columns: 3,
        components: [
          { id: 'c-kpi-ord-tot', type: 'KPICard', props: { title: 'Gözləyən Sifarişlər', value: '42', color: 'amber' } },
          { id: 'c-kpi-ord-suc', type: 'KPICard', props: { title: 'Tamamlanan', value: '142', color: 'emerald' } },
          { id: 'c-kpi-ord-can', type: 'KPICard', props: { title: 'Ləğv Edilən', value: '5', color: 'rose' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-agronomist',
    name: 'AI Aqronom Məsləhətçisi',
    slug: '/agronom',
    module: 'AI_SERVICES',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-agro-chat',
        type: 'INTERACTIVE',
        name: 'Aqronom Çat Pəncərəsi',
        columns: 1,
        components: [
          { id: 'c-agro-header', type: 'Heading', props: { text: '24/7 Süni İntellekt Aqronom', level: 'h2', align: 'center' } },
          { id: 'c-agro-card', type: 'Card', props: { title: 'Bitki Xəstəliyi Şəklini Yükləyin', description: 'Şəkli analiz edərək sizə dərhal dəqiq diaqnoz və müalicə planı təqdim edək.' } }
        ]
      }
    ]
  },
  {
    pageId: 'page-campaigns',
    name: 'Kampaniyalar & Endirimlər',
    slug: '/campaigns',
    module: 'MARKETING',
    status: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'sec-camp-list',
        type: 'GRID',
        name: 'Aktiv Mövsüm Kampaniyaları',
        columns: 2,
        components: [
          { id: 'c-camp-1', type: 'Card', props: { title: 'Payız Əkini Endirimi', description: 'Bütün taxıl toxumlarında 15% endirim' } },
          { id: 'c-camp-2', type: 'Card', props: { title: 'Damla Suvarma Təklifi', description: 'Təchizat xərclərində 20% cashback' } }
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

    const pages = (block && block.props && Array.isArray(block.props.pages) && block.props.pages.length >= 3)
      ? block.props.pages
      : ALL_SYSTEM_PAGES;

    return Response.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching visual builder pages:', error);
    return Response.json({ success: false, pages: ALL_SYSTEM_PAGES });
  }
}

export async function POST(request) {
  const authUser = await getAuthUser(request);
  const denied = requireRole(authUser, ['ADMIN', 'SUPER_ADMIN']);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { pages, action } = body;

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
