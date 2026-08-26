'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Eye,
  Save, Sparkles, FolderTree, Layers, ShieldCheck,
  RefreshCw, Plus, CheckCircle, ArrowLeft, ChevronDown,
  Search, Copy, Trash2, Globe, Layout, Settings
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
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [pageSearchTerm, setPageSearchTerm] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Page Modal Form State
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

  // Create New Custom Page / Module
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

  const handleDuplicatePage = (pageIdx) => {
    const srcPage = pages[pageIdx];
    if (!srcPage) return;

    const clonedPage = {
      ...srcPage,
      pageId: `page-${Date.now()}`,
      name: `${srcPage.name} (Kopya)`,
      slug: `${srcPage.slug}-copy`,
      updatedAt: new Date().toISOString()
    };

    const newPages = [...pages, clonedPage];
    pushHistory(newPages);
    setActivePageIndex(newPages.length - 1);
    showToast(`'${clonedPage.name}' dublikasiya edildi!`);
  };

  const handleDeletePage = (pageIdx) => {
    if (pages.length <= 1) {
      showToast('Ən azı 1 səhifə qalmalıdır', 'error');
      return;
    }
    const pageToDelete = pages[pageIdx];
    if (!window.confirm(`'${pageToDelete.name}' səhifəsini silmək istədiyinizdən əminsiniz?`)) return;

    const newPages = pages.filter((_, idx) => idx !== pageIdx);
    pushHistory(newPages);
    setActivePageIndex(0);
    showToast(`'${pageToDelete.name}' səhifəsi silindi!`);
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

  const filteredPages = pages.filter(p =>
    p.name.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
    (p.module && p.module.toLowerCase().includes(pageSearchTerm.toLowerCase()))
  );

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
        {/* Comprehensive Page / Module Selector Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Studio</span>
          </span>

          <div className="h-4 w-px bg-gray-200" />

          {/* Active Page / Module Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPageDropdown(!showPageDropdown)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-100/90 hover:bg-gray-200/70 text-gray-900 text-xs font-bold transition-all border border-gray-200 shadow-2xs"
            >
              <Layout className="w-3.5 h-3.5 text-brand-600" />
              <span>{activePage?.name || 'Səhifə Seçin'}</span>
              <span className="text-[10px] text-gray-400 font-mono">({activePage?.slug})</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-1" />
            </button>

            {/* Dropdown Menu with Search & All Pages */}
            {showPageDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-fadeIn">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Bütün səhifələrdə axtar..."
                      value={pageSearchTerm}
                      onChange={(e) => setPageSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredPages.map((p, idx) => {
                    const originalIdx = pages.findIndex(pg => pg.pageId === p.pageId);
                    const isSelected = activePageIndex === originalIdx;

                    return (
                      <div
                        key={p.pageId}
                        onClick={() => {
                          setActivePageIndex(originalIdx);
                          setSelectedElement(null);
                          setShowPageDropdown(false);
                        }}
                        className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between group ${
                          isSelected ? 'bg-brand-50 text-brand-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate">
                          <span className="block truncate">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{p.slug}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicatePage(originalIdx);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Kopyala"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(originalIdx);
                            }}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowPageDropdown(false);
                      setShowCreatePageModal(true);
                    }}
                    className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Səhifə / Modul Yarat</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreatePageModal(true)}
            className="p-1.5 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="Yeni Səhifə Əlavə Et"
          >
            <Plus className="w-4 h-4" />
          </button>
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

      {/* Create New Page Modal */}
      {showCreatePageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-brand-700 to-emerald-700 text-white flex items-center justify-between">
              <h3 className="text-base font-black">Yeni Səhifə / Modul Yarat</h3>
              <button onClick={() => setShowCreatePageModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreatePage} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Səhifə / Modul Adı <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Aqrar Xəbərlər, Xüsusi Sifarişlər"
                  value={newPageForm.name}
                  onChange={(e) => setNewPageForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">URL Path (Slug) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="/agro-news"
                  value={newPageForm.slug}
                  onChange={(e) => setNewPageForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Modul Kateqoriyası</label>
                <select
                  value={newPageForm.module}
                  onChange={(e) => setNewPageForm(p => ({ ...p, module: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-500 bg-white"
                >
                  <option value="MARKETPLACE">Marketplace & Alış-Veriş</option>
                  <option value="PRODUCTS">Məhsullar & Kataloq</option>
                  <option value="ORDERS">Sifarişlər & Ödənişlər</option>
                  <option value="AI_SERVICES">Süni İntellekt Xidmətləri</option>
                  <option value="CUSTOM">Digər / Xüsusi Səhifə</option>
                </select>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePageModal(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700"
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
