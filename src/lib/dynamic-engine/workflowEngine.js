import { prisma } from '@/lib/prisma';

export const DEFAULT_WORKFLOWS = [
  {
    id: 'wf-products',
    entity: 'Product',
    name: 'Məhsul Yoxlanış & Dərc Axını',
    description: 'Yeni daxil olan məhsul və elanların təsdiq mərhələləri',
    initialState: 'PENDING_REVIEW',
    states: [
      { id: 'DRAFT', name: 'Qaralama', color: 'gray', badge: 'bg-gray-100 text-gray-800' },
      { id: 'PENDING_REVIEW', name: 'Yoxlanışda', color: 'amber', badge: 'bg-amber-100 text-amber-800' },
      { id: 'ACTIVE', name: 'Təsdiqlənib / Canlıda', color: 'emerald', badge: 'bg-emerald-100 text-emerald-800' },
      { id: 'REJECTED', name: 'İmtina Edilib', color: 'rose', badge: 'bg-rose-100 text-rose-800' },
      { id: 'EXPIRED', name: 'Müddəti Bitib', color: 'slate', badge: 'bg-slate-100 text-slate-800' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'PENDING_REVIEW', label: 'Təsdiqə Göndər', roles: ['STORE', 'FARMER', 'ADMIN'] },
      { from: 'PENDING_REVIEW', to: 'ACTIVE', label: 'Məhsulu Təsdiqlə', roles: ['ADMIN', 'MODERATOR', 'SUPER_ADMIN'] },
      { from: 'PENDING_REVIEW', to: 'REJECTED', label: 'İmtina Et', roles: ['ADMIN', 'MODERATOR', 'SUPER_ADMIN'] },
      { from: 'ACTIVE', to: 'EXPIRED', label: 'Arxivlə / Bitir', roles: ['ADMIN', 'SYSTEM'] }
    ],
    automations: [
      {
        id: 'auto-product-approve',
        onTransition: { from: 'PENDING_REVIEW', to: 'ACTIVE' },
        actions: [
          { type: 'SEND_NOTIFICATION', title: 'Məhsulunuz təsdiqləndi!', message: 'Məhsulunuz uğurla yoxlanıldı və satışa çıxarıldı.' },
          { type: 'CREATE_AUDIT_LOG', details: 'Product marked active by admin' }
        ]
      },
      {
        id: 'auto-product-reject',
        onTransition: { from: 'PENDING_REVIEW', to: 'REJECTED' },
        actions: [
          { type: 'SEND_NOTIFICATION', title: 'Məhsuldan imtina edildi', message: 'Məhsulunuz qaydalara uyğun olmadığı üçün imtina edildi.' }
        ]
      }
    ]
  },
  {
    id: 'wf-orders',
    entity: 'Order',
    name: 'Sifariş & Çatdırılma Axını',
    description: 'Sifarişin ödənilməsindən çatdırılmasına qədər olan avtomatlaşdırma',
    initialState: 'PENDING',
    states: [
      { id: 'PENDING', name: 'Gözləmədə', color: 'amber', badge: 'bg-amber-100 text-amber-800' },
      { id: 'PAID', name: 'Ödənilib', color: 'blue', badge: 'bg-blue-100 text-blue-800' },
      { id: 'PROCESSING', name: 'Hazırlanır', color: 'indigo', badge: 'bg-indigo-100 text-indigo-800' },
      { id: 'SHIPPED', name: 'Yoldadır', color: 'purple', badge: 'bg-purple-100 text-purple-800' },
      { id: 'DELIVERED', name: 'Çatdırıldı', color: 'emerald', badge: 'bg-emerald-100 text-emerald-800' },
      { id: 'CANCELLED', name: 'Ləğv Edildi', color: 'rose', badge: 'bg-rose-100 text-rose-800' }
    ],
    transitions: [
      { from: 'PENDING', to: 'PAID', label: 'Ödənişi Qəbul Et', roles: ['SYSTEM', 'ADMIN'] },
      { from: 'PAID', to: 'PROCESSING', label: 'Hazırlığa Başla', roles: ['STORE', 'FARMER', 'ADMIN'] },
      { from: 'PROCESSING', to: 'SHIPPED', label: 'Kuryerə Ver', roles: ['STORE', 'FARMER', 'ADMIN', 'DELIVERY_PARTNER'] },
      { from: 'SHIPPED', to: 'DELIVERED', label: 'Çatdırıldı', roles: ['DELIVERY_PARTNER', 'ADMIN'] },
      { from: 'PENDING', to: 'CANCELLED', label: 'Ləğv Et', roles: ['BUYER', 'ADMIN'] }
    ],
    automations: [
      {
        id: 'auto-order-delivered',
        onTransition: { from: 'SHIPPED', to: 'DELIVERED' },
        actions: [
          { type: 'SEND_NOTIFICATION', title: 'Sifarişiniz çatdırıldı!', message: 'Zəhmət olmasa satıcı və məhsulu qiymətləndirin.' },
          { type: 'ADD_LOYALTY_POINTS', points: 10 }
        ]
      }
    ]
  }
];

export async function getSystemWorkflows() {
  try {
    const configBlock = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'system_workflows_engine' }
    });

    if (configBlock && configBlock.props && Array.isArray(configBlock.props.workflows)) {
      return configBlock.props.workflows;
    }
    return DEFAULT_WORKFLOWS;
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return DEFAULT_WORKFLOWS;
  }
}

export async function saveSystemWorkflows(workflows, adminUser = 'SYSTEM') {
  try {
    let block = await prisma.dynamicBlock.findFirst({
      where: { page: 'system', type: 'system_workflows_engine' }
    });

    const payload = {
      workflows,
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
          type: 'system_workflows_engine',
          props: payload
        }
      });
    }

    return { success: true, workflows };
  } catch (error) {
    console.error('Error saving workflows:', error);
    throw error;
  }
}
