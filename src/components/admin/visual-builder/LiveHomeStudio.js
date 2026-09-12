"use client";
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { apiFetch } from "@/lib/apiClient";

const DEFAULT_BLOCKS = [
  { type: "HERO_SLIDER", props: {} },
  { type: "PROMO_SLIDER", props: {} },
  { type: "CATEGORIES", props: { title: "Kateqoriyalar", count: 10 } },
  { type: "PREMIUM_ADS", props: { title: "Premium Elanlar" } },
  { type: "LATEST_ADS", props: { title: "Yeni Elanlar", count: 8 } },
  { type: "BUNDLES", props: { title: "Bağlamalar" } },
  { type: "STATS", props: {} },
  { type: "BLOG", props: {} }
];

export default function LiveHomeStudio() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);

  // ── VisualEditor (canlı tıkla-düzəliş) inteqrasiyası ──
  const [visualActive, setVisualActive] = useState(false);
  const [veStatus, setVeStatus] = useState("");
  const blocksRef = useRef([]);
  const pendingMediaRef = useRef(null);
  const fileInputRef = useRef(null);
  const veSaveTimerRef = useRef(null);
  blocksRef.current = blocks;

  const postToIframe = (msg) => {
    const iframe = document.getElementById("preview-iframe");
    if (iframe?.contentWindow) iframe.contentWindow.postMessage(msg, "*");
  };

  // Blok düzəlişlərini dərhal DB-yə yaz (debounce)
  const persistBlocksDebounced = (updatedBlocks) => {
    clearTimeout(veSaveTimerRef.current);
    veSaveTimerRef.current = setTimeout(async () => {
      try {
        await apiFetch("/api/blocks", {
          method: "POST",
          body: JSON.stringify({ page: "home", blocks: updatedBlocks }),
        });
      } catch (e) {
        console.error("VisualEditor autosave xətası:", e);
      }
    }, 900);
  };

  // VisualEditor-dən gələn mətn düzəlişi
  const handleVeText = async (d) => {
    const idx = d.block !== null && d.block !== undefined ? Number(d.block) : null;
    if (idx !== null && Number.isInteger(idx) && blocksRef.current[idx]) {
      const updated = [...blocksRef.current];
      updated[idx] = { ...updated[idx], props: { ...updated[idx].props, [d.key]: d.text } };
      setBlocks(updated);
      blocksRef.current = updated;
      postToIframe({ type: "FMK_LIVE_UPDATE", blocks: updated });
      persistBlocksDebounced(updated);
      setVeStatus(`✓ "${d.key}" blokda güncəlləndi`);
    } else {
      // Sayt ümumi mətni (SiteText) — mövcuddursa PUT, deyilsə POST ilə yarat
      try {
        await apiFetch("/api/admin/site-texts", {
          method: "PUT",
          body: JSON.stringify({ texts: [{ key: d.key, valueAz: d.text }] }),
        });
        setVeStatus(`✓ Sayt mətni "${d.key}" güncəlləndi`);
      } catch (e) {
        try {
          await apiFetch("/api/admin/site-texts", {
            method: "POST",
            body: JSON.stringify({ key: d.key, valueAz: d.text, group: "visual", label: d.key }),
          });
          setVeStatus(`✓ Sayt mətni "${d.key}" yaradıldı`);
        } catch (e2) {
          setVeStatus("⚠ Xəta: " + (e2.message || e.message));
        }
      }
    }
  };

  // VisualEditor şəkil seçimi → fayl dialoqu
  const handleVeMedia = (d) => {
    pendingMediaRef.current = d;
    fileInputRef.current?.click();
  };

  const onMediaFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const d = pendingMediaRef.current;
    if (!file || !d) return;
    const fd = new FormData();
    fd.append("files", file);
    try {
      const res = await apiFetch("/api/upload", { method: "POST", body: fd });
      const url = res?.images?.[0]?.url;
      if (!url) throw new Error("Yükləmə cavabında url yoxdur");
      if (d.targetKey && d.targetKey.startsWith("slide-")) {
        // Ana slayder şəkli — birbaşa DB-yə yaz
        const slideId = d.targetKey.slice("slide-".length);
        await apiFetch(`/api/slides/${slideId}`, {
          method: "PATCH",
          body: JSON.stringify({ imageUrl: url }),
        });
      } else if (d.block !== null && d.block !== undefined) {
        const idx = Number(d.block);
        if (Number.isInteger(idx) && blocksRef.current[idx]) {
          const updated = [...blocksRef.current];
          updated[idx] = { ...updated[idx], props: { ...updated[idx].props, [d.targetKey]: url } };
          setBlocks(updated);
          blocksRef.current = updated;
          postToIframe({ type: "FMK_LIVE_UPDATE", blocks: updated });
          persistBlocksDebounced(updated);
        }
      }
      postToIframe({ type: "SET_MEDIA_RESULT", targetKey: d.targetKey, url });
      setVeStatus("✓ Şəkil güncəlləndi");
    } catch (err) {
      setVeStatus("⚠ Şəkil xətası: " + err.message);
    }
  };

  const toggleVisualEdit = () => {
    const next = !visualActive;
    setVisualActive(next);
    postToIframe({ type: "TOGGLE_VISUAL_EDIT", active: next });
    setVeStatus(next ? "Redaktə rejimi AÇIQ — ekranda mətnə/şəkilə klikləyin" : "Redaktə rejimi bağlı");
  };

  useEffect(() => {
    fetchBlocks();
    
    // Listen for clicks + VisualEditor events inside the iframe preview
    const handleMessage = (e) => {
      if (e.data?.type === "FMK_BLOCK_CLICK") {
        const incomingIndex = e.data.index;
        if (
          Number.isInteger(incomingIndex) &&
          incomingIndex >= 0 &&
          incomingIndex < blocksRef.current.length
        ) {
          setActiveBlockIndex(incomingIndex);
        }
      } else if (e.data?.type === "VISUAL_EDITOR_READY") {
        // Editor yükləndi — redaktə rejimi açıqdursa yenidən aktivləşdir
        if (visualActive) postToIframe({ type: "TOGGLE_VISUAL_EDIT", active: true });
      } else if (e.data?.type === "SAVE_I18N" && e.data.key) {
        handleVeText(e.data);
      } else if (e.data?.type === "PICK_MEDIA") {
        handleVeMedia(e.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualActive]);

  async function fetchBlocks() {
    try {
      const data = await apiFetch("/api/blocks?page=home");
      if (data && data.length > 0) {
        setBlocks(data);
      } else {
        setBlocks(DEFAULT_BLOCKS); // Load defaults if empty
      }
    } catch (e) {
      console.error(e);
      setBlocks(DEFAULT_BLOCKS);
    } finally {
      setLoading(false);
    }
  }

  async function saveLayout() {
    setSaving(true);
    try {
      await apiFetch("/api/blocks", {
        method: "POST",
        body: JSON.stringify({ page: "home", blocks })
      });
      // Tell iframe to reload blocks
      const iframe = document.getElementById("preview-iframe");
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: "FMK_RELOAD_BLOCKS" }, "*");
      }
      alert("Dizayn uğurla yadda saxlanıldı! ");
    } catch (e) {
      alert("Xəta: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const addBlock = (type) => {
    let newBlock = { type, props: {} };
    if (type === "CATEGORIES") newBlock.props = { title: "Kateqoriyalar", subtitle: "Məhsul növünü seçin", count: 10 };
    if (type === "PREMIUM_ADS") newBlock.props = { title: "Premium Elanlar", subtitle: "Önə çıxan elanlar" };
    if (type === "LATEST_ADS") newBlock.props = { title: "Yeni Elanlar", subtitle: "Ən son əlavə edilmiş məhsullar", count: 8 };
    if (type === "BUNDLES") newBlock.props = { title: "Bağlamalar" };
    
    setBlocks([...blocks, newBlock]);
    setActiveBlockIndex(blocks.length);
  };

  const removeBlock = (index) => {
    const updated = [...blocks];
    updated.splice(index, 1);
    setBlocks(updated);
    setActiveBlockIndex(null);
  };

  const moveBlock = (index, direction) => {
    const updated = [...blocks];
    if (direction === "up" && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      setActiveBlockIndex(index - 1);
    } else if (direction === "down" && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      setActiveBlockIndex(index + 1);
    }
    setBlocks(updated);
  };

  const updateActiveBlock = (key, value) => {
    if (
      activeBlockIndex === null ||
      !Number.isInteger(activeBlockIndex) ||
      activeBlockIndex < 0 ||
      activeBlockIndex >= blocks.length
    ) return;
    const updated = [...blocks];
    updated[activeBlockIndex].props = {
      ...updated[activeBlockIndex].props,
      [key]: value
    };
    setBlocks(updated);
    
    // Live preview update
    const iframe = document.getElementById("preview-iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ 
        type: "FMK_LIVE_UPDATE", 
        blocks: updated 
      }, "*");
    }
  };

  if (loading) return <div className="p-10 text-center">Studiya yüklənir...</div>;

  const activeBlock = activeBlockIndex !== null ? blocks[activeBlockIndex] : null;

  return (
    <div className="flex h-[85vh] min-h-[560px] overflow-hidden bg-gray-50 rounded-xl border border-gray-200 -mx-1">
      {/* LEFT PANEL: Editor & Blocks */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-lg shrink-0">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">Visual Studio</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVisualEdit}
              title="Ekranda mətnə/şəkilə klikləyərək canlı düzəliş edin"
              className={`${visualActive ? "bg-purple-600 hover:bg-purple-700 animate-pulse" : "bg-gray-200 hover:bg-gray-300 text-gray-700"} text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition`}
            >
              {visualActive ? "● Redaktə AÇIQ" : "Vizual Redaktə"}
            </button>
            <button 
              onClick={saveLayout}
              disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              {saving ? "..." : "Yadda Saxla"}
            </button>
          </div>
        </div>
        {veStatus && (
          <div className="px-4 py-2 text-[11px] text-gray-600 bg-purple-50 border-b border-purple-100 truncate">
            {veStatus}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onMediaFile}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Active Block Editor */}
          {activeBlock ? (
            <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl relative">
              <button 
                onClick={() => setActiveBlockIndex(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-800"
              >
                <Icon name="close" size={16} />
              </button>
              <h3 className="font-bold text-brand-800 text-sm mb-3">
                Edit: {activeBlock.type}
              </h3>
              
              <div className="space-y-3">
                {Object.keys(activeBlock.props).map(key => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">{key}</label>
                    <input 
                      type={typeof activeBlock.props[key] === 'number' ? 'number' : 'text'}
                      value={activeBlock.props[key]}
                      onChange={(e) => updateActiveBlock(key, e.target.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full text-sm border border-brand-200 rounded-lg p-2 focus:ring-2 focus:ring-brand-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center p-4 border border-dashed rounded-xl">
              Düzəliş etmək üçün sağdakı paneldən və ya aşağıdakı siyahıdan bir bloka klikləyin.
            </div>
          )}

          {/* Block List */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Səhifənin Strukturu (Home)</h3>
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${activeBlockIndex === i ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  onClick={() => setActiveBlockIndex(i)}
                >
                  <div className="flex flex-col gap-1">
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 'up'); }} className="text-gray-400 hover:text-brand-600"><Icon name="arrowUp" size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 'down'); }} className="text-gray-400 hover:text-brand-600"><Icon name="arrowDown" size={14} /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{b.type}</p>
                    <p className="text-[10px] text-gray-400 truncate">{b.props.title || "No title"}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeBlock(i); }} className="text-red-400 hover:text-red-600 p-1">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Block */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Modul Əlavə Et</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addBlock('HERO_SLIDER')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Ana Slider</button>
              <button onClick={() => addBlock('PROMO_SLIDER')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Promo Kartlar</button>
              <button onClick={() => addBlock('CATEGORIES')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Kateqoriyalar</button>
              <button onClick={() => addBlock('PREMIUM_ADS')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Premium Elanlar</button>
              <button onClick={() => addBlock('LATEST_ADS')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Yeni Elanlar</button>
              <button onClick={() => addBlock('BUNDLES')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Bağlamalar</button>
              <button onClick={() => addBlock('STATS')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Statistika</button>
              <button onClick={() => addBlock('BLOG')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Blog / Xəbərlər</button>
              <button onClick={() => addBlock('AD_BANNER')} className="text-[11px] font-semibold border border-gray-200 rounded-lg p-2 hover:bg-gray-50 hover:border-brand-300 transition">Reklam Banneri</button>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL: Live Preview iframe */}
      <div className="flex-1 bg-gray-200 p-4 relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full z-10 shadow-lg pointer-events-none">
          Live Preview — blok seçmək üçün klikləyin · vizual redaktə rejimində mətn/şəkillərə birbaşa klikləyin
        </div>
        <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800 relative">
           <iframe 
             id="preview-iframe"
             src="/?editMode=true"
             className="w-full h-full border-none"
           />
        </div>
      </div>
    </div>
  );
}
