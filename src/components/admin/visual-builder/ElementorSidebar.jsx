'use client';

import React, { useState } from 'react';
import {
  Search, Grid, Type, Image as ImageIcon, FileText, Video,
  MousePointerClick, Minus, ArrowUpDown, MapPin, ShoppingBag,
  FolderTree, CheckSquare, Sparkles, Activity, BarChart3,
  Layers, Settings, ChevronLeft, Trash2, Copy, Eye,
  Palette, Sliders, Layout, ShieldCheck, Undo2, Redo2,
  Monitor, Tablet, Smartphone, Plus
} from 'lucide-react';
import ImageUploadField from '@/components/ui/ImageUploadField';

export const ELEMENTOR_WIDGETS = [
  // Layout
  {
    type: 'Columns',
    label: 'Bölmə (Columns)',
    icon: Grid,
    category: 'BASIC',
    defaultProps: { columns: 2, name: 'Yeni Sütun Bölməsi' }
  },
  {
    type: 'Heading',
    label: 'Başlıq (Heading)',
    icon: Type,
    category: 'BASIC',
    defaultProps: { text: 'Yeni Başlıq Mətni', level: 'h2', align: 'left', color: '#111827' }
  },
  {
    type: 'Image',
    label: 'Şəkil (Image)',
    icon: ImageIcon,
    category: 'BASIC',
    defaultProps: { src: '/placeholder.jpg', alt: 'Şəkil', rounded: true, shadow: true }
  },
  {
    type: 'Text',
    label: 'Mətn Redaktoru',
    icon: FileText,
    category: 'BASIC',
    defaultProps: { text: 'Buraya ətraflı məlumat və ya məhsul açıqlamasını daxil edin...', align: 'left' }
  },
  {
    type: 'Button',
    label: 'Düymə (Button)',
    icon: MousePointerClick,
    category: 'BASIC',
    defaultProps: { text: 'İndi Keçid Edin', url: '/products', variant: 'primary', size: 'md' }
  },
  {
    type: 'Video',
    label: 'Video Pleyer',
    icon: Video,
    category: 'BASIC',
    defaultProps: { url: 'https://youtube.com', autoplay: false }
  },
  {
    type: 'Divider',
    label: 'Ayırıcı Xətt',
    icon: Minus,
    category: 'BASIC',
    defaultProps: { style: 'solid', color: '#e5e7eb', width: '100%' }
  },
  {
    type: 'Spacer',
    label: 'Boşluq (Spacer)',
    icon: ArrowUpDown,
    category: 'BASIC',
    defaultProps: { height: '32px' }
  },
  // Agrar & E-Commerce PRO
  {
    type: 'ProductList',
    label: 'Məhsullar Şəbəkəsi',
    icon: ShoppingBag,
    category: 'AGRAR',
    defaultProps: { title: 'Tövsiyə Olunan Məhsullar', limit: 8, columns: 4, filter: 'ACTIVE' }
  },
  {
    type: 'CategoriesSlider',
    label: 'Kateqoriyalar',
    icon: FolderTree,
    category: 'AGRAR',
    defaultProps: { limit: 12, showIcons: true }
  },
  {
    type: 'Card',
    label: 'Təqdimat Kartı',
    icon: Layout,
    category: 'AGRAR',
    defaultProps: { title: 'Xüsusi Təklif', description: 'Kampaniyadan indi faydalanın', buttonText: 'Bax', buttonUrl: '/campaigns' }
  },
  {
    type: 'AIAgronomist',
    label: 'AI Aqronom Bloku',
    icon: Sparkles,
    category: 'AGRAR',
    defaultProps: { title: 'Süni İntellekt Aqronom', description: 'Bitkinin şəklini göndərin, xəstəliyi dərhal təyin edək.' }
  },
  {
    type: 'KPICard',
    label: 'Statistika (KPI)',
    icon: Activity,
    category: 'ANALYTICS',
    defaultProps: { title: 'Aktiv İstifadəçilər', value: '1,250+', trend: '+15%', color: 'emerald' }
  },
  {
    type: 'LineChart',
    label: 'Satış Qrafiki',
    icon: BarChart3,
    category: 'ANALYTICS',
    defaultProps: { title: 'Aylıq Satışlar', dataSource: 'MONTHLY_SALES' }
  },
  {
    type: 'Form',
    label: 'Əlaqə Formu',
    icon: CheckSquare,
    category: 'FORMS',
    defaultProps: { title: 'Bizimlə Əlaqə Saxlayın', submitText: 'Məktubu Göndər' }
  }
];

export default function ElementorSidebar({
  selectedElement,
  onClearSelection,
  onUpdateElement,
  onDeleteElement,
  onAddComponent,
  activePage,
  pages,
  onSelectPage,
  onOpenCreatePage,
  viewMode,
  onChangeViewMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveDraft,
  onPublish,
  isSaving,
  isPublishing
}) {
  const [activeTab, setActiveTab] = useState('ELEMENTS'); // 'ELEMENTS' | 'SETTINGS'
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectorTab, setInspectorTab] = useState('CONTENT'); // 'CONTENT' | 'STYLE' | 'ADVANCED'
  const [showPageMenu, setShowPageMenu] = useState(false);

  const filteredWidgets = ELEMENTOR_WIDGETS.filter(w =>
    w.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e, widget) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isEditing = Boolean(selectedElement);

  return (
    <div className="w-[340px] bg-[#1e2327] text-gray-200 border-r border-[#2c3338] flex flex-col shrink-0 select-none h-full z-30">
      {/* ── Top Header ── */}
      <div className="h-14 bg-[#1e2327] border-b border-[#2c3338] px-4 flex items-center justify-between shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-lg hover:bg-[#2c3338] text-gray-400 hover:text-white transition-colors"
              title="Geri qayıt (Elementlər)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                {selectedElement.isSection ? 'Bölmə Redaktoru' : 'Widget Redaktoru'}
              </span>
              <h3 className="text-xs font-black text-white truncate">
                {selectedElement.type || selectedElement.name || 'Element'}
              </h3>
            </div>
            <button
              onClick={onDeleteElement}
              className="p-1.5 rounded-lg hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 transition-colors"
              title="Elementi sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                FM
              </div>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                Visual Studio
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#15191c] p-0.5 rounded-lg border border-[#2c3338]">
              <button
                onClick={() => setActiveTab('ELEMENTS')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  activeTab === 'ELEMENTS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                ELEMENTS
              </button>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  activeTab === 'SETTINGS' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                GLOBAL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isEditing ? (
          /* ── INSPECTOR MODE (Edit Widget/Section) ── */
          <div className="flex flex-col h-full">
            {/* Inspector Tabs */}
            <div className="flex border-b border-[#2c3338] bg-[#15191c] px-2 pt-1 gap-1">
              <button
                onClick={() => setInspectorTab('CONTENT')}
                className={`flex-1 py-2 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  inspectorTab === 'CONTENT'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>MƏZMUN</span>
              </button>
              <button
                onClick={() => setInspectorTab('STYLE')}
                className={`flex-1 py-2 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  inspectorTab === 'STYLE'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>STİL</span>
              </button>
              <button
                onClick={() => setInspectorTab('ADVANCED')}
                className={`flex-1 py-2 text-center text-[11px] font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  inspectorTab === 'ADVANCED'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ƏLAVƏ</span>
              </button>
            </div>

            {/* Inspector Form Fields */}
            <div className="p-4 space-y-4 text-xs">
              {inspectorTab === 'CONTENT' && (
                <div className="space-y-4">
                  {selectedElement.isSection ? (
                    <>
                      <div>
                        <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Bölmə Adı</label>
                        <input
                          type="text"
                          value={selectedElement.name || ''}
                          onChange={(e) => onUpdateElement(selectedElement.id, { ...selectedElement, name: e.target.value })}
                          className="w-full px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Sütun Sayı</label>
                        <div className="grid grid-cols-4 gap-1">
                          {[1, 2, 3, 4].map(cols => (
                            <button
                              key={cols}
                              type="button"
                              onClick={() => onUpdateElement(selectedElement.id, { ...selectedElement, columns: cols })}
                              className={`py-2 rounded-lg font-bold text-xs border ${
                                (selectedElement.columns || 1) === cols
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-[#15191c] border-[#3c434a] text-gray-400 hover:text-white'
                              }`}
                            >
                              {cols} Sütun
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Dynamic props inputs based on widget type */}
                      {selectedElement.props?.text !== undefined && (
                        <div>
                          <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Mətn / Başlıq</label>
                          <textarea
                            rows={3}
                            value={selectedElement.props.text}
                            onChange={(e) => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...selectedElement.props, text: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white outline-none focus:border-emerald-500 resize-y font-medium"
                          />
                        </div>
                      )}

                      {selectedElement.props?.title !== undefined && (
                        <div>
                          <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Başlıq (Title)</label>
                          <input
                            type="text"
                            value={selectedElement.props.title}
                            onChange={(e) => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...selectedElement.props, title: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      )}

                      {selectedElement.props?.description !== undefined && (
                        <div>
                          <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Açıqlama</label>
                          <textarea
                            rows={2}
                            value={selectedElement.props.description}
                            onChange={(e) => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...selectedElement.props, description: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white outline-none focus:border-emerald-500 resize-none"
                          />
                        </div>
                      )}

                      {selectedElement.props?.url !== undefined && (
                        <div>
                          <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Keçid Linki (URL)</label>
                          <input
                            type="text"
                            value={selectedElement.props.url}
                            onChange={(e) => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...selectedElement.props, url: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                          />
                        </div>
                      )}

                      {selectedElement.props?.src !== undefined && (
                        <div>
                          <ImageUploadField
                            label="Şəkil / Media Yüklə"
                            value={selectedElement.props.src}
                            onChange={(val) => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...selectedElement.props, src: val }
                            })}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {inspectorTab === 'STYLE' && (
                <div className="space-y-4">
                  {/* Text Color */}
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Mətn / İkon Rəngi</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.props?.color || (selectedElement.isSection ? '#ffffff' : '#111827')}
                        onChange={(e) => onUpdateElement(selectedElement.id, {
                          ...selectedElement,
                          props: { ...(selectedElement.props || {}), color: e.target.value }
                        })}
                        className="w-10 h-9 bg-[#15191c] border border-[#3c434a] rounded-xl cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        value={selectedElement.props?.color || '#111827'}
                        onChange={(e) => onUpdateElement(selectedElement.id, {
                          ...selectedElement,
                          props: { ...(selectedElement.props || {}), color: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white font-mono text-xs outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Arxa Fon Rəngi</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.style?.bg || (selectedElement.isSection ? '#15803d' : '#ffffff')}
                        onChange={(e) => onUpdateElement(selectedElement.id, {
                          ...selectedElement,
                          style: { ...(selectedElement.style || {}), bg: e.target.value }
                        })}
                        className="w-10 h-9 bg-[#15191c] border border-[#3c434a] rounded-xl cursor-pointer p-1"
                      />
                      <input
                        type="text"
                        value={selectedElement.style?.bg || '#ffffff'}
                        onChange={(e) => onUpdateElement(selectedElement.id, {
                          ...selectedElement,
                          style: { ...(selectedElement.style || {}), bg: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-white font-mono text-xs outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Mətn Düzülüşü (Align)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['left', 'center', 'right'].map(align => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => onUpdateElement(selectedElement.id, {
                            ...selectedElement,
                            props: { ...(selectedElement.props || {}), align }
                          })}
                          className={`py-1.5 rounded-lg text-xs font-bold capitalize border ${
                            (selectedElement.props?.align || 'left') === align
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-[#15191c] border-[#3c434a] text-gray-400 hover:text-white'
                          }`}
                        >
                          {align === 'left' ? 'Sola' : align === 'center' ? 'Mərkəz' : 'Sağa'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heading Level (if heading) */}
                  {selectedElement.type === 'Heading' && (
                    <div>
                      <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Şrift Ölçüsü / Teq</label>
                      <div className="grid grid-cols-4 gap-1">
                        {['h1', 'h2', 'h3', 'h4'].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...(selectedElement.props || {}), level: lvl }
                            })}
                            className={`py-1.5 rounded-lg text-xs font-bold uppercase border ${
                              (selectedElement.props?.level || 'h2') === lvl
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-[#15191c] border-[#3c434a] text-gray-400 hover:text-white'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Button Variant */}
                  {selectedElement.type === 'Button' && (
                    <div>
                      <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Düymə Stili</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['primary', 'secondary', 'outline'].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => onUpdateElement(selectedElement.id, {
                              ...selectedElement,
                              props: { ...(selectedElement.props || {}), variant: v }
                            })}
                            className={`py-1.5 rounded-lg text-xs font-bold capitalize border ${
                              (selectedElement.props?.variant || 'primary') === v
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-[#15191c] border-[#3c434a] text-gray-400 hover:text-white'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inspectorTab === 'ADVANCED' && (
                <div className="space-y-4">
                  {/* Padding / Spacing */}
                  <div>
                    <label className="block text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">Daxili Məsafə (Padding)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['py-4', 'py-8', 'py-12'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onUpdateElement(selectedElement.id, {
                            ...selectedElement,
                            style: { ...(selectedElement.style || {}), padding: p }
                          })}
                          className={`py-1.5 rounded-lg text-xs font-bold border ${
                            (selectedElement.style?.padding || 'py-8') === p
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-[#15191c] border-[#3c434a] text-gray-400 hover:text-white'
                          }`}
                        >
                          {p === 'py-4' ? 'Kiçik' : p === 'py-8' ? 'Orta' : 'Geniş'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Responsive Visibility */}
                  <div className="p-3 bg-[#15191c] rounded-xl border border-[#3c434a] space-y-2">
                    <span className="text-[11px] font-bold text-gray-300 block">Responsiv Görünüş</span>
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                      <input type="checkbox" className="rounded text-emerald-600 focus:ring-0" />
                      <span>Mobil cihazlarda gizlət</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                      <input type="checkbox" className="rounded text-emerald-600 focus:ring-0" />
                      <span>Planşetlərdə gizlət</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'ELEMENTS' ? (
          /* ── WIDGETS LIBRARY MODE (Elementor 2-Col Grid) ── */
          <div className="p-3 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Widget..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#15191c] border border-[#3c434a] rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Widgets Grid */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 px-1 mb-2 block">
                  ƏSAS ELEMENTLƏR
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {filteredWidgets.map((w) => {
                    const IconComp = w.icon;
                    return (
                      <div
                        key={w.type}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, w)}
                        onClick={() => onAddComponent(w)}
                        className="flex flex-col items-center justify-center p-3.5 bg-[#15191c] hover:bg-[#252c33] border border-[#2c3338] hover:border-emerald-500/60 rounded-xl cursor-grab active:cursor-grabbing transition-all group shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1e2327] group-hover:bg-emerald-600/20 text-gray-400 group-hover:text-emerald-400 flex items-center justify-center mb-1.5 transition-colors">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-300 text-center line-clamp-1 group-hover:text-white">
                          {w.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── GLOBAL / PAGE SETTINGS ── */
          <div className="p-4 space-y-4 text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Səhifə Tənzimləmələri
            </span>
            <div className="p-3 bg-[#15191c] rounded-xl border border-[#3c434a] space-y-2">
              <div>
                <span className="text-gray-400 block text-[10px] font-bold">Aktiv Səhifə</span>
                <span className="text-white font-bold text-sm">{activePage?.name}</span>
                <span className="text-gray-500 font-mono text-[10px] block">{activePage?.slug}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Elementor Bottom Dark Action Bar ── */}
      <div className="h-12 bg-[#15191c] border-t border-[#2c3338] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          {/* Page Switcher Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#252c33] rounded-lg transition-colors"
              title="Səhifəni dəyiş"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showPageMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#1e2327] rounded-2xl border border-[#3c434a] shadow-2xl p-3 z-50 animate-fadeIn" data-lenis-prevent="true">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#2c3338] mb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-400">Sistem Səhifələri</span>
                  <span className="text-[10px] font-mono text-gray-400">{(pages || []).length} səhifə</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {(pages || []).map((p, idx) => (
                    <button
                      key={p.pageId || idx}
                      onClick={() => {
                        onSelectPage(idx);
                        setShowPageMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-[#252c33] hover:text-white flex items-center justify-between transition-colors group"
                    >
                      <span className="truncate group-hover:text-emerald-400">{p.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono group-hover:text-gray-300">{p.slug}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowPageMenu(false);
                    onOpenCreatePage();
                  }}
                  className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Səhifə / Modul Yarat</span>
                </button>
              </div>
            )}
          </div>

          {/* Viewport Switcher */}
          <button
            onClick={() => onChangeViewMode('desktop')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'desktop' ? 'text-emerald-400 bg-[#252c33]' : 'text-gray-400 hover:text-white'}`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeViewMode('tablet')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'tablet' ? 'text-emerald-400 bg-[#252c33]' : 'text-gray-400 hover:text-white'}`}
            title="Planşet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeViewMode('mobile')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'mobile' ? 'text-emerald-400 bg-[#252c33]' : 'text-gray-400 hover:text-white'}`}
            title="Mobil"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* History Undo/Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Geri al (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="İrəli al (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Big Elementor SAVE / PUBLISH Button */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5 transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isPublishing ? '...' : 'DƏRC ET'}</span>
        </button>
      </div>
    </div>
  );
}
