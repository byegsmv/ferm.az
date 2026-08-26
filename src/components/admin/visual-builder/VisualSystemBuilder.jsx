'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Eye,
  Save, Sparkles, FolderTree, Layers, ShieldCheck,
  RefreshCw, Plus, CheckCircle, ArrowLeft
} from 'lucide-react';
import ComponentCatalog from './ComponentCatalog';
import CanvasEditor from './CanvasEditor';
import InspectorPanel from './InspectorPanel';
import ImpactAnalysisModal from './ImpactAnalysisModal';
import { apiFetch } from '@/lib/apiClient';

export default function VisualSystemBuilder() {
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState(null);

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load pages
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/system-builder');
      if (res && res.pages) {
        setPages(res.pages);
        setHistory([JSON.stringify(res.pages)]);
        setHistoryIndex(0);
      }
    } catch (err) {
      console.error(err);
      showToast('Səhifələr yüklənmədi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const pushHistory = (newPages) => {
    const serialized = JSON.stringify(newPages);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(serialized);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setPages(newPages);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = JSON.parse(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
      setPages(prev);
      setSelectedElement(null);
      showToast('Geri qaytarıldı (Undo)');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = JSON.parse(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
      setPages(next);
      setSelectedElement(null);
      showToast('İrəli qaytarıldı (Redo)');
    }
  };

  const activePage = pages[activePageIndex] || null;

  // Add Component from Catalog into current Section or create new section
  const handleAddComponent = (catalogItem) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };

    const newComp = {
      id: `c-${Date.now()}`,
      type: catalogItem.type,
      props: { ...catalogItem.defaultProps }
    };

    if (!targetPage.sections || targetPage.sections.length === 0) {
      targetPage.sections = [
        {
          id: `sec-${Date.now()}`,
          name: 'Əsas Bölmə',
          columns: 1,
          components: [newComp]
        }
      ];
    } else {
      // Add to selected section or last section
      const targetSecIndex = targetPage.sections.length - 1;
      targetPage.sections[targetSecIndex].components = [
        ...(targetPage.sections[targetSecIndex].components || []),
        newComp
      ];
    }

    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    setSelectedElement(newComp);
    showToast(`${catalogItem.label} əlavə olundu`);
  };

  const handleAddSection = () => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const newSec = {
      id: `sec-${Date.now()}`,
      name: `Bölmə #${(targetPage.sections?.length || 0) + 1}`,
      columns: 1,
      components: []
    };
    targetPage.sections = [...(targetPage.sections || []), newSec];
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    setSelectedElement({ ...newSec, isSection: true });
    showToast('Yeni bölmə əlavə edildi');
  };

  const handleDeleteSection = (sectionId) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    targetPage.sections = targetPage.sections.filter(s => s.id !== sectionId);
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    if (selectedElement?.id === sectionId) setSelectedElement(null);
    showToast('Bölmə silindi');
  };

  const handleMoveSection = (fromIdx, toIdx) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const sections = [...targetPage.sections];
    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    targetPage.sections = sections;
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
  };

  const handleDeleteComponent = (sectionId, componentId) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const sec = targetPage.sections.find(s => s.id === sectionId);
    if (sec) {
      sec.components = sec.components.filter(c => c.id !== componentId);
    }
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    if (selectedElement?.id === componentId) setSelectedElement(null);
    showToast('Komponent silindi');
  };

  const handleUpdateElement = (elementId, updatedElement) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };

    if (updatedElement.isSection) {
      targetPage.sections = targetPage.sections.map(s => s.id === elementId ? updatedElement : s);
    } else {
      targetPage.sections.forEach(sec => {
        sec.components = (sec.components || []).map(c => c.id === elementId ? updatedElement : c);
      });
    }

    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    setSelectedElement(updatedElement);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/admin/system-builder', {
        method: 'POST',
        body: JSON.stringify({ pages, action: 'Save Draft' })
      });
      showToast('Qaralama uğurla yadda saxlanıldı');
    } catch (err) {
      console.error(err);
      showToast('Xəta baş verdi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await apiFetch('/api/admin/system-builder', {
        method: 'POST',
        body: JSON.stringify({ pages, action: 'Publish to Live' })
      });
      setShowImpactModal(false);
      showToast('Bütün sistem dəyişiklikləri canlıya tətbiq edildi!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Dərc etmə zamanı xəta baş verdi', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[750px] flex items-center justify-center bg-white rounded-3xl border border-gray-200">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        <span className="ml-3 text-sm font-bold text-gray-700">Visual System Studio yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Action Studio Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
        {/* Page Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Studio</span>
          </span>

          <div className="h-4 w-px bg-gray-200" />

          {/* Page Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            {pages.map((p, idx) => (
              <button
                key={p.pageId}
                onClick={() => {
                  setActivePageIndex(idx);
                  setSelectedElement(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activePageIndex === idx
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Breakpoints & History Controls */}
        <div className="flex items-center gap-4">
          {/* Responsive Mode Switcher */}
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl text-gray-500">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-gray-900'}`}
              title="Desktop Görünüşü"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'tablet' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-gray-900'}`}
              title="Planşet Görünüşü"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white text-brand-600 shadow-xs' : 'hover:text-gray-900'}`}
              title="Mobil Görünüşü"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200 hidden md:block" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-all"
              title="Geri al (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-all"
              title="İrəli al (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Save Draft & Publish */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Qaralama Saxla</span>
            </button>

            <button
              onClick={() => setShowImpactModal(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Canlıya Dərc Et</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Component Catalog */}
        <ComponentCatalog onAddComponent={handleAddComponent} />

        {/* Center Live Canvas */}
        <CanvasEditor
          page={activePage}
          viewMode={viewMode}
          selectedElementId={selectedElement?.id}
          onSelectElement={setSelectedElement}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onMoveSection={handleMoveSection}
          onDeleteComponent={handleDeleteComponent}
        />

        {/* Right Inspector Panel */}
        <InspectorPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={() => {
            if (selectedElement?.isSection) {
              handleDeleteSection(selectedElement.id);
            }
          }}
        />
      </div>

      {/* Pre-Publish Impact Verification Modal */}
      <ImpactAnalysisModal
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        onConfirmPublish={handlePublish}
        isPublishing={isPublishing}
        pages={pages}
      />
    </div>
  );
}
