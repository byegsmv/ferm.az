'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';
import ElementorSidebar from './ElementorSidebar';
import ElementorCanvas from './ElementorCanvas';
import ImpactAnalysisModal from './ImpactAnalysisModal';
import { CheckCircle, RefreshCw, Plus } from 'lucide-react';

export default function VisualSystemBuilder() {
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Page Form State
  const [newPageForm, setNewPageForm] = useState({
    name: '',
    slug: '',
    module: 'CUSTOM'
  });

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

  const activePage = pages[activePageIndex] || pages[0] || null;

  // Add Component into Section or New Section
  const handleAddComponent = (catalogItem, targetSectionId = null) => {
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
          columns: catalogItem.type === 'Columns' ? 2 : 1,
          components: catalogItem.type === 'Columns' ? [] : [newComp]
        }
      ];
    } else if (targetSectionId) {
      const sec = targetPage.sections.find(s => s.id === targetSectionId);
      if (sec) {
        sec.components = [...(sec.components || []), newComp];
      }
    } else {
      const lastSecIndex = targetPage.sections.length - 1;
      targetPage.sections[lastSecIndex].components = [
        ...(targetPage.sections[lastSecIndex].components || []),
        newComp
      ];
    }

    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    setSelectedElement(newComp);
    showToast(`${catalogItem.label} əlavə edildi`);
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

  const handleDuplicateSection = (sectionIdx) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const srcSec = targetPage.sections[sectionIdx];
    if (!srcSec) return;

    const clonedSec = {
      ...srcSec,
      id: `sec-${Date.now()}`,
      name: `${srcSec.name} (Kopya)`,
      components: (srcSec.components || []).map(c => ({
        ...c,
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }))
    };

    targetPage.sections.splice(sectionIdx + 1, 0, clonedSec);
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    setSelectedElement({ ...clonedSec, isSection: true });
    showToast('Bölmə dublikasiya edildi');
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

  const handleDuplicateComponent = (sectionId, component) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const sec = targetPage.sections.find(s => s.id === sectionId);
    if (sec) {
      const clonedComp = {
        ...component,
        id: `c-${Date.now()}`,
        props: { ...(component.props || {}) }
      };
      const compIdx = sec.components.findIndex(c => c.id === component.id);
      sec.components.splice(compIdx + 1, 0, clonedComp);
    }
    newPages[activePageIndex] = targetPage;
    pushHistory(newPages);
    showToast('Komponent dublikasiya edildi');
  };

  const handleMoveComponent = (sectionId, fromIdx, toIdx) => {
    if (!activePage) return;
    const newPages = [...pages];
    const targetPage = { ...newPages[activePageIndex] };
    const sec = targetPage.sections.find(s => s.id === sectionId);
    if (sec && sec.components) {
      const components = [...sec.components];
      const [moved] = components.splice(fromIdx, 1);
      components.splice(toIdx, 0, moved);
      sec.components = components;
      newPages[activePageIndex] = targetPage;
      pushHistory(newPages);
    }
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

  // Create New Page Modal Form
  const handleCreatePage = (e) => {
    e.preventDefault();
    if (!newPageForm.name.trim() || !newPageForm.slug.trim()) {
      showToast('Səhifə adı və URL slug daxil edilməlidir', 'error');
      return;
    }

    const newPage = {
      pageId: `page-${Date.now()}`,
      name: newPageForm.name.trim(),
      slug: newPageForm.slug.startsWith('/') ? newPageForm.slug.trim() : `/${newPageForm.slug.trim()}`,
      module: newPageForm.module || 'CUSTOM',
      status: 'PUBLISHED',
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: `sec-${Date.now()}`,
          name: 'Əsas Bölmə',
          columns: 1,
          components: [
            {
              id: `c-${Date.now()}`,
              type: 'Heading',
              props: { text: newPageForm.name.trim(), level: 'h1', align: 'left' }
            }
          ]
        }
      ]
    };

    const newPages = [...pages, newPage];
    pushHistory(newPages);
    setActivePageIndex(newPages.length - 1);
    setShowCreatePageModal(false);
    setNewPageForm({ name: '', slug: '', module: 'CUSTOM' });
    showToast(`'${newPage.name}' səhifəsi yaradıldı!`);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/admin/system-builder', {
        method: 'POST',
        body: JSON.stringify({ pages, action: 'Save Draft' })
      });
      showToast('Qaralama saxlanıldı');
    } catch (err) {
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
      showToast('Bütün dəyişikliklər canlıya tətbiq edildi!', 'success');
    } catch (err) {
      showToast('Dərc olunmadı', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[750px] flex items-center justify-center bg-[#1e2327] rounded-3xl border border-gray-800 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mr-3" />
        <span className="text-sm font-bold">Elementor Visual Studio yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex bg-[#121517] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
          notification.type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-200' : 'bg-emerald-950 border-emerald-800 text-emerald-200'
        }`}>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ── Left Elementor Sidebar ── */}
      <ElementorSidebar
        selectedElement={selectedElement}
        onClearSelection={() => setSelectedElement(null)}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={() => {
          if (selectedElement?.isSection) {
            handleDeleteSection(selectedElement.id);
          }
        }}
        onAddComponent={handleAddComponent}
        activePage={activePage}
        pages={pages}
        onSelectPage={setActivePageIndex}
        onOpenCreatePage={() => setShowCreatePageModal(true)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onSaveDraft={handleSaveDraft}
        onPublish={() => setShowImpactModal(true)}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />

      {/* ── Center Elementor Live Canvas ── */}
      <ElementorCanvas
        page={activePage}
        viewMode={viewMode}
        selectedElementId={selectedElement?.id}
        onSelectElement={setSelectedElement}
        onAddSection={handleAddSection}
        onDeleteSection={handleDeleteSection}
        onMoveSection={handleMoveSection}
        onDuplicateSection={handleDuplicateSection}
        onDeleteComponent={handleDeleteComponent}
        onDuplicateComponent={handleDuplicateComponent}
        onMoveComponent={handleMoveComponent}
        onDropWidget={handleAddComponent}
      />

      {/* Create New Page Modal */}
      {showCreatePageModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1e2327] rounded-2xl max-w-md w-full shadow-2xl border border-gray-700 text-white overflow-hidden">
            <div className="p-5 bg-emerald-700 flex items-center justify-between">
              <h3 className="text-sm font-black">Yeni Səhifə / Modul Yarat</h3>
              <button onClick={() => setShowCreatePageModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreatePage} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Səhifə / Modul Adı <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Aqrar Bloq, Fermer Səhifəsi"
                  value={newPageForm.name}
                  onChange={(e) => setNewPageForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#15191c] border border-gray-700 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">URL Slug <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="/yeni-sehife"
                  value={newPageForm.slug}
                  onChange={(e) => setNewPageForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#15191c] border border-gray-700 rounded-xl text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="pt-3 border-t border-gray-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePageModal(false)}
                  className="px-4 py-2 font-bold text-gray-400 hover:text-white"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Səhifəni Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
