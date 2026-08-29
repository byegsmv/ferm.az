'use client';

import React, { useState } from 'react';
import {
  Plus, Trash2, Edit3, ArrowUp, ArrowDown, Copy,
  Sparkles, Layers, Box, Move, ShoppingBag, FolderTree,
  FileText, Activity, CheckSquare, BarChart3, GripVertical
} from 'lucide-react';
import DynamicWidgetRenderer from '@/components/admin/dynamic/DynamicWidgetRenderer';

export default function ElementorCanvas({
  page,
  viewMode = 'desktop',
  selectedElementId,
  onSelectElement,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteComponent,
  onDuplicateComponent,
  onMoveComponent,
  onDropWidget
}) {
  const [dragOverSectionId, setDragOverSectionId] = useState(null);
  const [isDragOverBottom, setIsDragOverBottom] = useState(false);

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
    return 'max-w-[1240px]';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleSectionDrop = (e, sectionId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSectionId(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const widget = JSON.parse(dataStr);
        onDropWidget(widget, sectionId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBottomDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverBottom(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const widget = JSON.parse(dataStr);
        onDropWidget(widget, null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-[#121517] overflow-y-auto p-4 sm:p-8 flex flex-col items-center custom-scrollbar" data-lenis-prevent="true">
      {/* Canvas Viewport Mock Container */}
      <div
        className={`w-full ${getContainerWidth()} min-h-[750px] bg-white rounded-2xl shadow-2xl border border-gray-300 flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Elementor Page Header Indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-2 font-black text-gray-800">{page.name}</span>
            <span className="text-gray-400 font-mono">({page.slug})</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {page.status || 'PUBLISHED'}
          </span>
        </div>

        {/* Live Canvas Sections Stream */}
        <div className="p-4 sm:p-6 space-y-4 flex-1">
          {(page.sections || []).map((section, sIdx) => {
            const isSectionSelected = selectedElementId === section.id;
            const isOverThisSection = dragOverSectionId === section.id;
            const totalSections = (page.sections || []).length;

            return (
              <div
                key={section.id || sIdx}
                onDragOver={(e) => {
                  handleDragOver(e);
                  setDragOverSectionId(section.id);
                }}
                onDragLeave={() => setDragOverSectionId(null)}
                onDrop={(e) => handleSectionDrop(e, section.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement({ ...section, isSection: true });
                }}
                className={`group relative rounded-2xl border-2 transition-all p-5 ${
                  isSectionSelected
                    ? 'border-[#0073aa] ring-4 ring-[#0073aa]/15'
                    : isOverThisSection
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-dashed border-gray-200 hover:border-[#0073aa]/60'
                } ${!section.style?.bg ? 'bg-white' : ''}`}
                style={{ backgroundColor: section.style?.bg || undefined }}
              >
                {/* Elementor Floating Section Header Bar */}
                <div className="absolute -top-3.5 left-4 flex items-center gap-1 bg-[#1e2327] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <span className="text-emerald-400">Section:</span>
                  <span>{section.name || `Bölmə #${sIdx + 1}`}</span>
                  <span className="text-gray-400 ml-1">({section.columns || 1} sütun)</span>

                  <div className="h-3 w-px bg-gray-600 mx-1" />

                  {/* Section Reorder */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sIdx > 0 && onMoveSection) onMoveSection(sIdx, sIdx - 1);
                    }}
                    disabled={sIdx === 0}
                    className="p-1 hover:text-emerald-400 disabled:opacity-30"
                    title="Bölməni Yuxarı Daşı"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (sIdx < totalSections - 1 && onMoveSection) onMoveSection(sIdx, sIdx + 1);
                    }}
                    disabled={sIdx === totalSections - 1}
                    className="p-1 hover:text-emerald-400 disabled:opacity-30"
                    title="Bölməni Aşağı Daşı"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <div className="h-3 w-px bg-gray-600 mx-1" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSection(sIdx);
                    }}
                    className="p-1 hover:text-emerald-400"
                    title="Bölməni kopyala"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(section.id);
                    }}
                    className="p-1 hover:text-rose-400"
                    title="Bölməni sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Section Components Grid */}
                <div className={`grid gap-4 ${
                  section.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  section.columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
                  section.columns === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' :
                  'grid-cols-1'
                }`}>
                  {(section.components || []).length === 0 ? (
                    <div className="col-span-full py-10 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50/50 hover:bg-emerald-50/20 hover:border-emerald-300 transition-all">
                      <p className="text-xs font-bold text-gray-500">
                        Bu bölmə boşdur. Sol paneldən widget çəkib bura atın (Drag & Drop) və ya klikləyin.
                      </p>
                    </div>
                  ) : (
                    (section.components || []).map((comp, cIdx) => {
                      const isCompSelected = selectedElementId === comp.id;
                      const totalComps = (section.components || []).length;

                      return (
                        <div
                          key={comp.id || cIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(comp);
                          }}
                          className={`group/comp relative rounded-xl border-2 transition-all p-3.5 ${
                            isCompSelected
                              ? 'border-[#0073aa] ring-4 ring-[#0073aa]/20 bg-blue-50/20 shadow-md'
                              : 'border-transparent hover:border-[#0073aa]/50 hover:bg-white/40'
                          }`}
                        >
                          {/* Elementor Widget Floating Action Icons */}
                          <div className="absolute -top-3 right-3 flex items-center gap-1 bg-[#1e2327] text-white px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover/comp:opacity-100 transition-opacity z-20">
                            {/* Move Up/Down within section */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cIdx > 0 && onMoveComponent) onMoveComponent(section.id, cIdx, cIdx - 1);
                              }}
                              disabled={cIdx === 0}
                              className="p-0.5 hover:text-emerald-400 disabled:opacity-30"
                              title="Yuxarı Daşı"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cIdx < totalComps - 1 && onMoveComponent) onMoveComponent(section.id, cIdx, cIdx + 1);
                              }}
                              disabled={cIdx === totalComps - 1}
                              className="p-0.5 hover:text-emerald-400 disabled:opacity-30"
                              title="Aşağı Daşı"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            <div className="h-2.5 w-px bg-gray-600 mx-0.5" />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectElement(comp);
                              }}
                              className="p-0.5 hover:text-emerald-400"
                              title="Redaktə et"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateComponent(section.id, comp);
                              }}
                              className="p-0.5 hover:text-emerald-400"
                              title="Kopyala"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteComponent(section.id, comp.id);
                              }}
                              className="p-0.5 hover:text-rose-400"
                              title="Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Render Live Widget Preview */}
                          <DynamicWidgetRenderer component={comp} widget={comp} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Elementor Style "ADD NEW SECTION / Drag widget here" Box ── */}
          <div
            onDragOver={(e) => {
              handleDragOver(e);
              setIsDragOverBottom(true);
            }}
            onDragLeave={() => setIsDragOverBottom(false)}
            onDrop={handleBottomDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center gap-3 ${
              isDragOverBottom
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : 'border-gray-300 bg-gray-50/70 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={onAddSection}
                className="px-6 py-3 bg-[#9b0a46] hover:bg-[#b00c50] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>YENİ BÖLMƏ ƏLAVƏ ET</span>
              </button>
            </div>
            <span className="text-xs font-bold text-gray-400 italic">
              Və ya sol paneldən istənilən widget-i birbaşa bura atın (WordPress / Elementor Live Drag & Drop)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
