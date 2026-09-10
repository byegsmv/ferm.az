/**
 * ══════════════════════════════════════════════════════════════════════
 *  UniversalVisualEditor v2.0 — FermerMarket Visual System Module
 * ══════════════════════════════════════════════════════════════════════
 *  BÜTÜN səhifələrdə işləyir: hər mətn, düymə, link, başlıq, şəkil.
 *
 *  Rejimlər:
 *   • Normal (heç bir parametr yoxdur): səhifə açılan kimi override-ları
 *     səssizcə tətbiq edir — istifadəçilər redaktə edilmiş versiyanı görür.
 *   • Redaktə (?ve=1): klik-düzəliş rejimi. Mətnlərə klik → sətir içi düzəliş,
 *     şəkillərə klik → media paneli, linklərə klik → link paneli.
 *     Hər dəyişiklik avtomatik yadda saxlanılır (admin cookie tələb edir).
 *
 *  İnteqrasiya (istənilən Next.js layihəyə):
 *   <script defer src="/visual-editor/visual-editor.js"></script>
 *   + bu API: /api/admin/visual-overrides (GET public / POST admin)
 *
 *  Kompatibilik: iframe + postMessage rejimi (köhnə admin shell) dəstəklənir:
 *   TOGGLE_VISUAL_EDIT / SAVE_I18N / PICK_MEDIA mesajları qəbul edilir.
 * ══════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (window.__FMK_VE__) return; // bir dəfə yüklənsin
  window.__FMK_VE__ = true;

  var API = '/api/admin/visual-overrides';
  var PATH = window.location.pathname || '/';
  var EDITABLE_SEL = 'h1,h2,h3,h4,h5,h6,p,span,a,button,strong,em,b,i,label,li,td,th,figcaption,blockquote,small';

  var state = {
    active: false,
    overrides: {},   // key → {kind, value, prev}
    editMode: window.location.search.indexOf('ve=1') !== -1,
    editingEl: null,
    saveTimer: null,
    authFailed: false,
  };

  /* ─── Açar yaratma: sabit DOM yolu ─────────────────────────────── */
  function elKey(el) {
    if (el.getAttribute && el.getAttribute('data-ve-key')) return 'k:' + el.getAttribute('data-ve-key');
    var parts = [];
    var node = el;
    while (node && node !== document.body && parts.length < 12) {
      var tag = node.tagName.toLowerCase();
      var idx = 1, sib = node;
      while ((sib = sib.previousElementSibling)) { if (sib.tagName === node.tagName) idx++; }
      parts.unshift(tag + ':nth(' + idx + ')');
      node = node.parentElement;
    }
    return parts.join('>') || 'body';
  }

  function findByKey(key) {
    if (key.indexOf('k:') === 0) {
      var el = document.querySelector('[data-ve-key="' + key.slice(2) + '"]');
      if (el) return el;
    }
    // yolu getdik — kolleksiya indeksləri ilə
    try {
      var segs = key.split('>');
      var cur = document.body;
      for (var i = 0; i < segs.length; i++) {
        var m = segs[i].match(/^([a-z0-9-]+):nth\((\d+)\)$/);
        if (!m) return null;
        var kids = cur ? Array.prototype.filter.call(cur.children, function (c) { return c.tagName.toLowerCase() === m[1]; }) : [];
        cur = kids[parseInt(m[2], 10) - 1];
        if (!cur) return null;
      }
      return cur;
    } catch (e) { return null; }
  }

  // Yol tapılmadısa — köhnə mətnə görə axtarış (layout dəyişəndə də işləyir)
  function findByPrev(kind, prev, tagHint) {
    if (!prev) return null;
    var els = document.querySelectorAll(EDITABLE_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (kind === 'text' && el.children.length === 0 && el.textContent.trim() === prev.trim()) return el;
      if (kind === 'href' && el.tagName === 'A' && el.getAttribute('href') === prev) return el;
    }
    return null;
  }

  /* ─── Override tətbiqi ──────────────────────────────────────────── */
  function applyOverride(key, ov) {
    var el = findByKey(key) || findByPrev(ov.kind, ov.prev);
    if (!el) return;
    try {
      if (ov.kind === 'text') {
        if (el.children.length === 0) el.textContent = ov.value;
        else {
          // qarışıq element: ilk düz mətn qovşağını dəyiş
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) { el.childNodes[i].textContent = ov.value; break; }
          }
        }
      } else if (ov.kind === 'href' && el.tagName === 'A') {
        el.setAttribute('href', ov.value);
      } else if (ov.kind === 'src' && (el.tagName === 'IMG' || el.tagName === 'SOURCE')) {
        el.src = ov.value;
      } else if (ov.kind === 'bg') {
        el.style.backgroundImage = 'url("' + ov.value + '")';
      }
    } catch (e) {}
  }
  function applyAll() {
    var count = 0;
    Object.keys(state.overrides).forEach(function (key) {
      applyOverride(key, state.overrides[key]);
      count++;
    });
    if (count) {
      var ev = new CustomEvent('fmk:overrides-applied', { detail: { count: count } });
      document.dispatchEvent(ev);
    }
  }

  /* ─── Yükləmə ──────────────────────────────────────────────────── */
  function loadOverrides(cb) {
    fetch(API + '?path=' + encodeURIComponent(PATH), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        state.overrides = (d && d.overrides) || {};
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function saveOverride(key, kind, value, prev) {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(function () {
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ path: PATH, key: key, kind: kind, value: value, prev: prev }),
      })
        .then(function (r) {
          if (r.status === 403) {
            state.authFailed = true;
            toast('⚠ Yalnız admin redaktə edə bilər', true);
            return null;
          }
          return r.json();
        })
        .then(function (d) {
          if (d && d.success) {
            state.overrides[key] = { kind: kind, value: value, prev: prev };
            toast('✓ Yadda saxlanıldı');
          }
        })
        .catch(function () { toast('⚠ Şəbəkə xətası', true); });
    }, 350);
  }

  function resetElement(el, key) {
    var ov = state.overrides[key];
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ path: PATH, key: key, kind: ov ? ov.kind : 'text', value: '', prev: '', remove: true }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.success) {
          delete state.overrides[key];
          toast('Element sıfırlandı — səhifəni yeniləyin');
        }
      });
  }

  /* ─── Toast / UI ───────────────────────────────────────────────── */
  function toast(msg, isErr) {
    var t = document.getElementById('ve-toast') || document.createElement('div');
    t.id = 've-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:999999;background:' +
      (isErr ? '#dc2626' : '#15803d') + ';color:#fff;padding:8px 18px;border-radius:999px;font:600 13px sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);transition:opacity .3s;opacity:1;';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; }, 1600);
  }

  function addEditBar() {
    if (document.getElementById('ve-editbar')) return;
    var bar = document.createElement('div');
    bar.id = 've-editbar';
    bar.innerHTML =
      '<strong style="font-size:12px;letter-spacing:.06em;">✎ REDAKTƏ REJİMİ</strong>' +
      '<span style="font-size:12px;opacity:.75;">mətnə klik → düzəliş · şəkilə klik → dəyiş · linke klik → hədəf</span>' +
      '<span style="flex:1"></span>' +
      '<button id="ve-exit" style="font:600 12px sans-serif;background:#fff;color:#15803d;border:0;border-radius:999px;padding:5px 14px;cursor:pointer;">Bitir (Çıxış)</button>';
    document.body.appendChild(bar);

    document.getElementById('ve-exit').addEventListener('click', function () {
      var u = new URL(window.location.href);
      u.searchParams.delete('ve');
      window.location.href = u.toString();
    });
  }

  /* ─── Media paneli (şəkil dəyişmə) ────────────────────────────── */
  var mediaPanel = null;
  function openMediaPanel(el, key) {
    closeMediaPanel();
    mediaPanel = document.createElement('div');
    mediaPanel.style.cssText = 'position:fixed;top:64px;right:16px;z-index:999998;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:16px;width:300px;font-family:sans-serif;';
    var current = (el.tagName === 'IMG' ? el.src : (el.style.backgroundImage || '').replace(/url\("?([^")]+)"?\)/, '$1'));
    mediaPanel.innerHTML =
      '<div style="font:700 13px sans-serif;color:#15803d;margin-bottom:8px;">📷 Şəkli dəyiş</div>' +
      '<input id="ve-media-url" placeholder="Şəkil URL-i" value="' + (current || '') + '" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #d1d5db;border-radius:8px;font:13px sans-serif;margin-bottom:8px;">' +
      '<input id="ve-media-file" type="file" accept="image/*" style="width:100%;font:12px sans-serif;margin-bottom:10px;">' +
      '<button id="ve-media-ok" style="width:100%;font:600 12px sans-serif;background:#15803d;color:#fff;border:0;border-radius:999px;padding:8px;cursor:pointer;margin-bottom:6px;">Tətbiq et</button>' +
      '<button id="ve-media-cancel" style="width:100%;font:600 12px sans-serif;background:#f3f4f6;color:#374151;border:0;border-radius:999px;padding:8px;cursor:pointer;">Ləğv et</button>';
    document.body.appendChild(mediaPanel);

    document.getElementById('ve-media-cancel').addEventListener('click', closeMediaPanel);
    document.getElementById('ve-media-ok').addEventListener('click', function () {
      var f = document.getElementById('ve-media-file').files[0];
      if (f) {
        var fd = new FormData();
        fd.append('files', f);
        toast('Yüklənir...');
        fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var url = d.urls ? d.urls[0] : (d.url || d.fileUrl);
            if (!url) throw new Error('url yoxdur');
            applyAndSave(el, key, (el.tagName === 'IMG' ? 'src' : 'bg'), url, current);
            closeMediaPanel();
          })
          .catch(function () { toast('⚠ Yükləmə alınmadı', true); });
      } else {
        var url = document.getElementById('ve-media-url').value.trim();
        if (url) { applyAndSave(el, key, (el.tagName === 'IMG' ? 'src' : 'bg'), url, current); }
        closeMediaPanel();
      }
    });
  }
  function closeMediaPanel() { if (mediaPanel) { mediaPanel.remove(); mediaPanel = null; } }

  /* ─── Link paneli ──────────────────────────────────────────────── */
  var linkPanel = null;
  function openLinkPanel(el, key) {
    closeLinkPanel();
    var prev = el.getAttribute('href') || '';
    linkPanel = document.createElement('div');
    linkPanel.style.cssText = 'position:fixed;top:64px;right:16px;z-index:999998;background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:16px;width:300px;font-family:sans-serif;';
    linkPanel.innerHTML =
      '<div style="font:700 13px sans-serif;color:#15803d;margin-bottom:8px;">🔗 Linki dəyiş</div>' +
      '<input id="ve-link-url" placeholder="/məhsullar və ya https://..." value="' + prev + '" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #d1d5db;border-radius:8px;font:13px sans-serif;margin-bottom:10px;">' +
      '<button id="ve-link-ok" style="width:100%;font:600 12px sans-serif;background:#15803d;color:#fff;border:0;border-radius:999px;padding:8px;cursor:pointer;margin-bottom:6px;">Tətbiq et</button>' +
      '<button id="ve-link-cancel" style="width:100%;font:600 12px sans-serif;background:#f3f4f6;color:#374151;border:0;border-radius:999px;padding:8px;cursor:pointer;">Ləğv et</button>';
    document.body.appendChild(linkPanel);
    document.getElementById('ve-link-cancel').addEventListener('click', closeLinkPanel);
    document.getElementById('ve-link-ok').addEventListener('click', function () {
      var url = document.getElementById('ve-link-url').value.trim();
      if (url) applyAndSave(el, key, 'href', url, prev);
      closeLinkPanel();
    });
  }
  function closeLinkPanel() { if (linkPanel) { linkPanel.remove(); linkPanel = null; } }

  function applyAndSave(el, key, kind, value, prev) {
    if (kind === 'src') el.src = value;
    else if (kind === 'bg') el.style.backgroundImage = 'url("' + value + '")';
    else if (kind === 'href') el.setAttribute('href', value);
    saveOverride(key, kind, value, prev || '');
  }

  /* ─── Redaktə rejimi ────────────────────────────────────────────── */
  function editableTarget(e) {
    var el = e.target;
    if (!el || !el.closest) return null;
    // editor toolbar/panellərin özünə klik etmə
    if (el.closest('#ve-editbar') || el.closest('#ve-toast') || mediaPanel && el.closest('#ve-toast') || el.closest('[id^="ve-media"]') || el.closest('[id^="ve-link"]')) return null;
    var img = el.closest('img');
    if (img) return { el: img, kind: 'image' };
    var link = el.closest('a');
    if (link && link.querySelector('img')) return { el: link.querySelector('img'), kind: 'image' };
    var t = el.closest(EDITABLE_SEL);
    if (!t) return null;
    if (t.textContent.trim().length === 0 && t.tagName !== 'A' && t.tagName !== 'BUTTON') return null;
    return { el: t, kind: (t.tagName === 'A' || t.closest('a')) ? 'link' : 'text' };
  }

  document.addEventListener('click', function (e) {
    if (!state.active) return;
    var target = editableTarget(e);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    var el = target.el, key = elKey(el);

    if (target.kind === 'image') {
      openMediaPanel(el, key);
      return;
    }
    if (target.kind === 'link') {
      var childImg = el.querySelector('img');
      if (childImg) { openMediaPanel(childImg, elKey(childImg)); return; }
      openLinkPanel(el, key);
      return;
    }
    // mətn: sətir içi redaktə
    if (state.editingEl && state.editingEl !== el) state.editingEl.removeAttribute('contenteditable');
    state.editingEl = el;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    el.addEventListener('blur', function onBlur() {
      el.removeEventListener('blur', onBlur);
      el.removeAttribute('contenteditable');
      var newText = el.textContent.trim();
      var old = state.overrides[key] ? state.overrides[key].prev : (el.dataset.veOrig || newText);
      if (newText !== old) {
        saveOverride(key, 'text', newText, old);
      }
    });
  }, true);

  // yönü dəyişəndə panelləri bağla
  document.addEventListener('click', function (e) {
    if (!state.active) return;
    if (!e.target.closest || (!e.target.closest('[id^="ve-media"]') && !e.target.closest('[id^="ve-link"]'))) {
      setTimeout(function () { closeMediaPanel(); closeLinkPanel(); }, 10);
    }
  }, false);

  document.addEventListener('keydown', function (e) {
    if (!state.active) return;
    if (e.key === 'Escape' && state.editingEl) { state.editingEl.blur(); }
  });

  /* ─── Stillər ──────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('ve-core-styles')) return;
    var st = document.createElement('style');
    st.id = 've-core-styles';
    st.textContent = [
      '#ve-editbar{position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(90deg,#14532d,#15803d);color:#fff;padding:9px 16px;display:flex;align-items:center;gap:14px;font-family:sans-serif;backdrop-filter:blur(8px);box-shadow:0 2px 12px rgba(0,0,0,.2);}',
      '.ve-active ' + EDITABLE_SEL.split(',').join(',') + '{}',
      'body.ve-active{cursor:context-menu;}',
      '.ve-active h1,.ve-active h2,.ve-active h3,.ve-active h4,.ve-active h5,.ve-active h6,.ve-active p,.ve-active span,.ve-active a,.ve-active button,.ve-active strong,.ve-active em,.ve-active b,.ve-active i,.ve-active label,.ve-active li,.ve-active td,.ve-active th,.ve-active small,.ve-active figcaption{outline:2px dashed rgba(21,128,61,.45);outline-offset:2px;cursor:pointer;}',
      '.ve-active h1:hover,.ve-active h2:hover,.ve-active h3:hover,.ve-active h4:hover,.ve-active p:hover,.ve-active span:hover,.ve-active a:hover,.ve-active button:hover,.ve-active li:hover,.ve-active label:hover{outline:2px solid #15803d;background:rgba(21,128,61,.06);}',
      '.ve-active img{outline:2px dashed rgba(234,88,12,.55);outline-offset:2px;cursor:crosshair;}',
      '.ve-active img:hover{outline:2px solid #ea580c;opacity:.85;}',
      '[contenteditable="true"].ve-editing,body.ve-active [contenteditable="true"]{outline:2px solid #22c55e !important;background:rgba(34,197,94,.08) !important;cursor:text !important;}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ─── İframe (köhnə admin shell) kompatibilik ──────────────────── */
  window.addEventListener('message', function (event) {
    var d = event.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'TOGGLE_VISUAL_EDIT') {
      if (d.active) enableEdit(); else disableEdit();
    }
    if (d.type === 'FMK_LIVE_UPDATE' || d.type === 'FMK_RELOAD_BLOCKS') {
      loadOverrides(applyAll);
    }
  });

  function enableEdit() {
    state.active = true;
    state.editMode = true;
    document.body.classList.add('ve-active');
    injectStyles();
    addEditBar();
    // orijinal mətnləri yadda saxla (sıfırlama üçün)
    document.querySelectorAll(EDITABLE_SEL).forEach(function (el) {
      if (!el.dataset.veOrig && el.children.length === 0) el.dataset.veOrig = el.textContent.trim();
    });
  }
  function disableEdit() {
    state.active = false;
    document.body.classList.remove('ve-active');
    var bar = document.getElementById('ve-editbar'); if (bar) bar.remove();
    if (state.editingEl) state.editingEl.removeAttribute('contenteditable');
    closeMediaPanel(); closeLinkPanel();
  }

  /* ─── Başlanğıc ────────────────────────────────────────────────── */
  function boot() {
    injectStyles();
    loadOverrides(function () {
      applyAll();
      if (state.editMode) enableEdit();
    });

    // SPA naviqasiyası: yol dəyişəndə override-ları yenidən tətbiq et
    var lastPath = PATH;
    setInterval(function () {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        PATH = lastPath;
        state.overrides = {};
        loadOverrides(applyAll);
      }
    }, 700);

    // İlk render gec gələn elementlər üçün təkrar tətbiq
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      applyAll();
      if (tries >= 8) clearInterval(iv);
    }, 750);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Köhnə adla bir də export (iframe shell uyğunluğu)
  window.VisualEditorInstance = {
    isActive: false,
    toggle: function (a) { if (a) enableEdit(); else disableEdit(); this.isActive = !!a; },
    getOverrides: function () { return state.overrides; },
    refresh: function () { loadOverrides(applyAll); },
  };
})();
