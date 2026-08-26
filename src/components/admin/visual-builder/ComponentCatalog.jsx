'use client';

import React, { useState } from 'react';
import {
  Layout, Type, Database, FormInput, Sparkles, BarChart3,
  Columns, Grid, Heading, Image, Table, CheckSquare,
  MousePointerClick, CreditCard, PieChart, Activity, MapPin, Search
} from 'lucide-react';

export const COMPONENT_CATALOG = [
  {
    category: 'Layout',
    icon: Layout,
    items: [
      { type: 'Container', label: 'Konteyner', icon: Layout, defaultProps: { padding: 'p-6', maxWidth: 'max-w-7xl' } },
      { type: 'Section', label: 'Bölmə (Section)', icon: Columns, defaultProps: { name: 'Yeni Bölmə', columns: 1, style: { bg: '#ffffff', padding: 'py-8' } } },
      { type: 'Grid', label: 'Şəbəkə (Grid 2/3/4)', icon: Grid, defaultProps: { columns: 3, gap: 'gap-4' } }
    ]
  },
  {
    category: 'Content',
    icon: Type,
    items: [
      { type: 'Heading', label: 'Başlıq (Heading)', icon: Heading, defaultProps: { text: 'Bölmə Başlığı', level: 'h2', align: 'left', color: '#111827' } },
      { type: 'Text', label: 'Mətn Bloku', icon: Type, defaultProps: { text: 'Buraya istədiyiniz açıqlama mətnini əlavə edə bilərsiniz.', size: 'text-sm' } },
      { type: 'Image', label: 'Şəkil / Banner', icon: Image, defaultProps: { src: '/placeholder.jpg', alt: 'Şəkil', rounded: 'rounded-xl' } }
    ]
  },
  {
    category: 'Data',
    icon: Database,
    items: [
      { type: 'ProductList', label: 'Məhsul Şəbəkəsi', icon: Database, defaultProps: { limit: 8, columns: 4, filter: 'ACTIVE' } },
      { type: 'CategoriesSlider', label: 'Kateqoriyalar Slayderi', icon: Grid, defaultProps: { limit: 10, showIcons: true } },
      { type: 'Table', label: 'Dinamik Cədvəl', icon: Table, defaultProps: { title: 'Məlumatlar', entity: 'products' } }
    ]
  },
  {
    category: 'Form',
    icon: FormInput,
    items: [
      { type: 'Input', label: 'Yazı Sahəsi (Input)', icon: FormInput, defaultProps: { label: 'Ad', placeholder: 'Daxil edin...', required: false } },
      { type: 'Search', label: 'Axtarış Sahəsi', icon: Search, defaultProps: { placeholder: 'Axtarış edin...', size: 'medium' } },
      { type: 'Checkbox', label: 'Seçim Qutusu', icon: CheckSquare, defaultProps: { label: 'Təsdiqləyirəm', checked: false } }
    ]
  },
  {
    category: 'Interaction',
    icon: Sparkles,
    items: [
      { type: 'Button', label: 'Düymə (Button)', icon: MousePointerClick, defaultProps: { label: 'Klikləyin', variant: 'primary', size: 'md' } },
      { type: 'Card', label: 'İnteraktiv Kart', icon: CreditCard, defaultProps: { title: 'Kart Başlığı', description: 'Qısa məzmun və fəaliyyət' } }
    ]
  },
  {
    category: 'Analytics',
    icon: BarChart3,
    items: [
      { type: 'KPICard', label: 'KPI Sayğacı', icon: Activity, defaultProps: { title: 'Dövriyyə', value: '₼ 12,400', trend: '+15%', color: 'emerald', icon: 'DollarSign' } },
      { type: 'LineChart', label: 'Qrafik (Xətti/Sütun)', icon: PieChart, defaultProps: { title: 'Aylıq Satış Dinamikası', dataSource: 'SALES' } }
    ]
  }
];

export default function ComponentCatalog({ onAddComponent }) {
  const [activeCategory, setActiveCategory] = useState('Layout');

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 select-none">
      <div className="p-3.5 border-b border-gray-100 bg-gray-50/60">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Komponent Kitabxanası</h4>
        <p className="text-[11px] text-gray-500 mt-0.5">Kətana əlavə etmək üçün klikləyin</p>
      </div>

      {/* Category Pills */}
      <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1 bg-gray-50/30">
        {COMPONENT_CATALOG.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeCategory === cat.category
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {COMPONENT_CATALOG.find(c => c.category === activeCategory)?.items.map(item => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(item));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAddComponent(item)}
              className="group p-2.5 rounded-xl border border-gray-200/70 hover:border-brand-500 hover:bg-brand-50/40 cursor-grab active:cursor-grabbing shadow-xs transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-brand-100 group-hover:text-brand-700 flex items-center justify-center text-gray-600 transition-colors">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-800 group-hover:text-brand-900">{item.label}</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-600 pointer-events-none">+</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
