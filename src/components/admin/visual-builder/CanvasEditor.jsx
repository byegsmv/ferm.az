'use client';

import React from 'react';
import {
  Plus, GripVertical, Trash2, Edit3, ArrowUp, ArrowDown,
  Sparkles, Layers, Box, Columns, Move
} from 'lucide-react';
import DynamicWidgetRenderer from '@/components/admin/dynamic/DynamicWidgetRenderer';

export default function CanvasEditor({
  page,
  viewMode = 'desktop',
  selectedElementId,
  onSelectElement,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onDeleteComponent
}) {
  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-gray-400">
        Səhifə seçilməyib
      </div>
    );
  }

  const getContainerWidth = () => {
    if (viewMode === 'mobile') return 'max-w-[390px]';
    if (viewMode === 'tablet') return 'max-w-[768px]';
    return 'max-w-[1280px]';
  };

  return (
    <div className="flex-1 bg-gray-100/70 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Canvas viewport container */}
      <div
        className={`w-full ${getContainerWidth()} min-h-[600px] bg-white rounded-3xl border border-gray-300/80 shadow-lg flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Visual Page Topbar Header Mock */}
        <div className="px-6 py-3.5 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-2 font-bold text-gray-700">{page.name}</span>
            <span className="text-gray-400 font-mono">({page.slug})</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {page.status}
          </span>
        </div>

        {/* Sections Stream */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {(page.sections || []).length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl p-6">
              <Box className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-600">Bu səhifədə hələ heç bir bölmə yoxdur</p>
              <p className="text-xs text-gray-400 mt-1">Aşağıdakı düyməyə klikləyərək yeni bölmə əlavə edin</p>
              <button
                onClick={onAddSection}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-700"
              >
                <Plus className="w-4 h-4" />
                <span>Bölmə Əlavə Et</span>
              </button>
            </div>
          ) : (
            (page.sections || []).map((section, sIdx) => {
              const isSectionSelected = selectedElementId === section.id;

              return (
                <div
                  key={section.id || sIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement({ ...section, isSection: true });
                  }}
                  className={`group relative rounded-2xl border-2 transition-all p-4 sm:p-5 ${
                    isSectionSelected
                      ? 'border-brand-600 bg-brand-50/10 shadow-md ring-4 ring-brand-500/10'
                      : 'border-dashed border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Section Controls Tag */}
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                        {section.name || `Bölmə #${sIdx + 1}`}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {section.columns || 1} Sütun
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {sIdx > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSection(sIdx, sIdx - 1);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Yuxarı qaldır"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {sIdx < (page.sections?.length || 0) - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveSection(sIdx, sIdx + 1);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Aşağı endir"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(section.id);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Bölməni sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Components Inside Section */}
                  <div className={`grid gap-4 ${
                    section.columns === 4 ? 'grid-cols-1 md:grid-cols-4' :
                    section.columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
                    section.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {(section.components || []).map((comp, cIdx) => {
                      const isCompSelected = selectedElementId === comp.id;

                      return (
                        <div
                          key={comp.id || cIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(comp);
                          }}
                          className={`relative rounded-xl border p-3 transition-all ${
                            isCompSelected
                              ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-2 ring-brand-500/20'
                              : 'border-gray-200/70 hover:border-brand-400 bg-white'
                          }`}
                        >
                          {/* Component Widget Rendering */}
                          <DynamicWidgetRenderer widget={comp} />

                          {/* Quick Component delete badge on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteComponent(section.id, comp.id);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Komponenti sil"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Add Section Button */}
          <button
            onClick={onAddSection}
            className="w-full py-3.5 border-2 border-dashed border-gray-200 hover:border-brand-500 hover:bg-brand-50/30 text-gray-500 hover:text-brand-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Bölmə Əlavə Et</span>
          </button>
        </div>
      </div>
    </div>
  );
}
