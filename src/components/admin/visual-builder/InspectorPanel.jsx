'use client';

import React, { useState } from 'react';
import {
  Sliders, Palette, Database, Shield, Zap,
  Trash2, Copy, Eye, EyeOff, Layers, ArrowUp, ArrowDown
} from 'lucide-react';

export default function InspectorPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveUp,
  onMoveDown
}) {
  const [activeTab, setActiveTab] = useState('general');

  if (!selectedElement) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full select-none text-gray-400">
        <Layers className="w-8 h-8 stroke-[1.5] mb-2 text-gray-300" />
        <p className="text-xs font-semibold text-gray-600">Element Seçilməyib</p>
        <p className="text-[11px] text-gray-400 mt-1">Xüsusiyyətlərini tənzimləmək üçün kətan üzərində hər hansı elementə klikləyin</p>
      </div>
    );
  }

  const { id, type, props = {}, isSection } = selectedElement;

  const handlePropChange = (key, value) => {
    onUpdateElement(id, {
      ...selectedElement,
      props: {
        ...props,
        [key]: value
      }
    });
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 select-none text-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
            {isSection ? 'Bölmə İnspektoru' : 'Element İnspektoru'}
          </span>
          <h4 className="font-bold text-gray-900 truncate max-w-[160px]">{type || selectedElement.name}</h4>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button onClick={onMoveUp} className="p-1 hover:bg-gray-200/70 rounded" title="Yuxarı daşı">
              <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="p-1 hover:bg-gray-200/70 rounded" title="Aşağı daşı">
              <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
          {onDuplicateElement && (
            <button onClick={onDuplicateElement} className="p-1 hover:bg-gray-200/70 rounded" title="Dublikat">
              <Copy className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
          {onDeleteElement && (
            <button onClick={onDeleteElement} className="p-1 hover:bg-rose-100 text-rose-600 rounded" title="Sil">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/30 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === 'general' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Ümumi
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === 'style' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Görünüş
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === 'data' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Data & Şərt
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'general' && (
          <div className="space-y-3.5">
            {/* Title / Heading text */}
            {('text' in props || type === 'Heading' || type === 'Text') && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mətn / Başlıq</label>
                <input
                  type="text"
                  value={props.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Subtitle / Description */}
            {('description' in props || type === 'Card') && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Açıqlama Mətni</label>
                <textarea
                  rows={2}
                  value={props.description || ''}
                  onChange={(e) => handlePropChange('description', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Button Label & URL */}
            {type === 'Button' || 'buttonText' in props && (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Düymə Mətni</label>
                  <input
                    type="text"
                    value={props.label || props.buttonText || ''}
                    onChange={(e) => handlePropChange(props.label !== undefined ? 'label' : 'buttonText', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Keçid Linki (URL)</label>
                  <input
                    type="text"
                    value={props.url || props.buttonUrl || ''}
                    onChange={(e) => handlePropChange(props.url !== undefined ? 'url' : 'buttonUrl', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            {/* KPI Specifics */}
            {type === 'KPICard' && (
              <>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Göstərici Dəyəri</label>
                  <input
                    type="text"
                    value={props.value || ''}
                    onChange={(e) => handlePropChange('value', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Trend Artımı</label>
                  <input
                    type="text"
                    value={props.trend || ''}
                    onChange={(e) => handlePropChange('trend', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-3.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Rəng Teması / Accent</label>
              <select
                value={props.color || 'emerald'}
                onChange={(e) => handlePropChange('color', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white"
              >
                <option value="emerald">Yaşıl (Brand Emerald)</option>
                <option value="blue">Göy (Blue)</option>
                <option value="purple">Bənövşəyi (Purple)</option>
                <option value="amber">Qızılı / Narıncı (Amber)</option>
                <option value="rose">Qırmızı (Rose)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mətn Düzülüşü (Align)</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => handlePropChange('align', align)}
                    className={`flex-1 py-1 text-center rounded border capitalize ${
                      props.align === align ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-3.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Məlumat Mənbəyi (Data Source)</label>
              <select
                value={props.dataSource || props.filter || 'ACTIVE'}
                onChange={(e) => handlePropChange('dataSource', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white"
              >
                <option value="ACTIVE">Aktiv Məhsullar (Products)</option>
                <option value="FEATURED">Seçilmiş Elanlar (VIP/Featured)</option>
                <option value="CATEGORIES">Bütün Kateqoriyalar</option>
                <option value="CUSTOM_API">Xarici API / Custom Query</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Görünüş Şərti (Role Guard)</label>
              <select
                value={props.roleGuard || 'ALL'}
                onChange={(e) => handlePropChange('roleGuard', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50/50 focus:bg-white"
              >
                <option value="ALL">Bütün İstifadəçilər</option>
                <option value="ADMIN_ONLY">Yalnız Admin & Moderator</option>
                <option value="FARMER_ONLY">Yalnız Fermerlər</option>
                <option value="STORE_ONLY">Yalnız Mağazalar</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
