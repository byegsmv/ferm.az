'use client';

import { useState, useRef } from 'react';
import { GripVertical, Trash2, Copy, Eye, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/apiClient';

const AVAILABLE_COMPONENTS = [
  { id: 'hero', name: 'Hero Section', icon: '🎯', category: 'Header' },
  { id: 'search', name: 'Search Bar', icon: '🔍', category: 'Header' },
  { id: 'categories', name: 'Categories Slider', icon: '📂', category: 'Content' },
  { id: 'products', name: 'Products Grid', icon: '🛍️', category: 'Content' },
  { id: 'banner', name: 'Banner/CTA', icon: '📢', category: 'Promotions' },
  { id: 'testimonials', name: 'Testimonials', icon: '⭐', category: 'Social Proof' },
  { id: 'blog', name: 'Blog Section', icon: '📝', category: 'Content' },
  { id: 'stats', name: 'Statistics', icon: '📊', category: 'Analytics' },
  { id: 'newsletter', name: 'Newsletter Signup', icon: '📧', category: 'Marketing' },
  { id: 'faq', name: 'FAQ', icon: '❓', category: 'Support' },
  { id: 'footer', name: 'Footer', icon: '🔗', category: 'Footer' },
];

export default function PageBuilder() {
  const { showToast } = useToast();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [components, setComponents] = useState([]);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [preview, setPreview] = useState(false);
  const dropZoneRef = useRef(null);

  // Add component
  const addComponent = (componentId) => {
    const component = AVAILABLE_COMPONENTS.find(c => c.id === componentId);
    const newComponent = {
      id: `${componentId}-${Date.now()}`,
      type: componentId,
      ...component,
      props: getDefaultProps(componentId),
      order: components.length,
    };
    setComponents([...components, newComponent]);
    showToast(`${component.name} əlavə olundu`, 'success');
  };

  // Remove component
  const removeComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
    showToast('Component silinib', 'success');
  };

  // Duplicate component
  const duplicateComponent = (id) => {
    const component = components.find(c => c.id === id);
    if (component) {
      const newComponent = {
        ...component,
        id: `${component.type}-${Date.now()}`,
      };
      setComponents([...components, newComponent]);
      showToast('Component dublikasiya olundu', 'success');
    }
  };

  // Reorder components
  const moveComponent = (fromIndex, toIndex) => {
    const newComponents = [...components];
    const [movedComponent] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, movedComponent);
    setComponents(newComponents);
  };

  // Save page
  const savePage = async () => {
    try {
      await apiFetch('/api/blocks', {
        method: 'POST',
        body: JSON.stringify({
          pageName: activePage?.name || 'homepage',
          components: components,
        }),
      });
      showToast('Səhifə saxlanıldı', 'success');
    } catch (err) {
      showToast('Saxlama xətası', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Sidebar - Component Library */}
      <div className="w-72 bg-white border-r border-slate-200 p-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Komponentlər</h3>
        
        {/* Component Categories */}
        {['Header', 'Content', 'Promotions', 'Social Proof', 'Support', 'Footer'].map(category => (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">{category}</h4>
            <div className="space-y-2">
              {AVAILABLE_COMPONENTS.filter(c => c.category === category).map(comp => (
                <button
                  key={comp.id}
                  draggable
                  onDragStart={() => setDraggedFrom(comp.id)}
                  onClick={() => addComponent(comp.id)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-brand-50 rounded-lg border border-slate-200 hover:border-brand-300 transition-all cursor-move"
                >
                  <span className="text-lg">{comp.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{comp.name}</p>
                    <p className="text-xs text-slate-500">Sürükləyin və ya tıklayın</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Səhifə Builder</h2>
            <p className="text-sm text-slate-500">Drag-drop ilə homepage'i düzəldin</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-700"
            >
              <Eye size={18} /> {preview ? 'Redaksiya' : 'Önizləmə'}
            </button>
            <button
              onClick={savePage}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 font-medium text-white transition-colors"
            >
              <Save size={18} /> Saxla
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-100 to-slate-50">
          <div
            ref={dropZoneRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedFrom) {
                addComponent(draggedFrom);
                setDraggedFrom(null);
              }
            }}
            className={`max-w-4xl mx-auto ${
              components.length === 0
                ? 'bg-white rounded-xl border-2 border-dashed border-slate-300 min-h-96 flex items-center justify-center flex-col gap-4'
                : 'space-y-4'
            }`}
          >
            {components.length === 0 ? (
              <div className="text-center">
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-slate-500 text-lg">Komponent əlavə etmək üçün sürükləyin</p>
                <p className="text-slate-400 text-sm mt-2">Soldan maddələri sürükləyin yaxud birbaşa tıklayın</p>
              </div>
            ) : (
              <>
                {/* Component List Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">Səhifə Struktur ({components.length} komponent)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {components.map((comp, idx) => (
                      <ComponentEditor
                        key={comp.id}
                        component={comp}
                        index={idx}
                        totalComponents={components.length}
                        onRemove={() => removeComponent(comp.id)}
                        onDuplicate={() => duplicateComponent(comp.id)}
                        onMoveUp={() => moveComponent(idx, idx - 1)}
                        onMoveDown={() => moveComponent(idx, idx + 1)}
                      />
                    ))}
                  </div>
                </div>

                {/* Properties Panel */}
                {components.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Component Xüsusiyyətləri</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Başlıq</label>
                        <input type="text" placeholder="Component başlığı" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fon Rəngi</label>
                        <input type="color" defaultValue="#ffffff" className="w-full h-10 border border-slate-300 rounded-lg cursor-pointer" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Təsviri</label>
                        <textarea placeholder="Component təsviri" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows="3"></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Preview/Info */}
      <div className="w-80 bg-white border-l border-slate-200 p-6 hidden xl:block overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Məlumat</h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">💡 İpuçları</p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Komponentləri sürükləyin yenidən sıralamaq üçün</li>
              <li>Hər komponenti fərdinə ləyihələndir</li>
              <li>Preview-də son görünüşü görin</li>
              <li>Saxla düyməsi ilə dəyişiklikləri yadda saxlayın</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">✅ Mövcud Komponentlər</p>
            <p className="text-xs text-green-800 mt-2">{components.length} / 11</p>
          </div>

          {/* Page Settings */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Səhifə Adı</label>
              <input type="text" defaultValue="Homepage" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SEO Başlığı</label>
              <input type="text" placeholder="Axtarış motoru başlığı" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Meta Təsviri</label>
              <textarea placeholder="Səhifə təsviri (160 xarakter)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows="2"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component Editor Item
function ComponentEditor({ component, index, totalComponents, onRemove, onDuplicate, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
      <button
        draggable
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1">
        <p className="font-medium text-slate-900">{component.name}</p>
        <p className="text-xs text-slate-500">{component.type}</p>
      </div>

      <div className="flex gap-1">
        <button
          onClick={onDuplicate}
          className="p-2 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
          title="Dublikasiya et"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-2 hover:bg-slate-200 text-slate-600 disabled:text-slate-300 rounded-lg transition-colors"
          title="Yuxarı"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalComponents - 1}
          className="p-2 hover:bg-slate-200 text-slate-600 disabled:text-slate-300 rounded-lg transition-colors"
          title="Aşağı"
        >
          ↓
        </button>
        <button
          onClick={onRemove}
          className="p-2 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
          title="Sil"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Get default props for component type
function getDefaultProps(type) {
  const defaults = {
    hero: { title: 'Hero Başlığı', subtitle: 'Alt başlık', buttonText: 'Başla' },
    search: { placeholder: 'Məhsul axtarın...' },
    categories: { showCount: true, autoScroll: true },
    products: { itemsPerRow: 4, showFilters: true },
    banner: { title: 'Xüsusi Təklif', ctaText: 'Daha Çox' },
    testimonials: { displayCount: 3, autoPlay: true },
    blog: { postsPerPage: 6, showDate: true },
    stats: { style: 'cards', animated: true },
    newsletter: { placeholder: 'Email daxil edin...', buttonText: 'Abunə ol' },
    faq: { collapsible: true, searchable: true },
    footer: { columns: 4, showSocial: true },
  };
  return defaults[type] || {};
}
