/**
 * VisualEditor — Standalone Reusable Live Edit Module
 * =====================================================
 * Drop this script into any admin preview iframe to enable
 * click-to-edit inline text editing with postMessage persistence.
 *
 * Usage:
 *   1. Include this script in the preview iframe page:
 *      <script src="visual-editor.js"></script>
 *
 *   2. Include visual-editor.css for the edit overlays.
 *
 *   3. In your admin/parent page, listen for messages:
 *      window.addEventListener('message', (e) => {
 *        if (e.data.type === 'SAVE_SETTINGS') { ... }
 *        if (e.data.type === 'SAVE_I18N') { ... }
 *        if (e.data.type === 'PICK_MEDIA') { ... }
 *      });
 *
 *   4. To toggle edit mode from the parent:
 *      iframe.contentWindow.postMessage({ type: 'TOGGLE_VISUAL_EDIT', active: true }, '*');
 *
 * Messages emitted (child → parent):
 *   { type: 'SAVE_SETTINGS', key: 'heroTag', value: 'Hello.' }
 *   { type: 'SAVE_I18N', key: 'hero-title', text: 'Hello.' }
 *   { type: 'PICK_MEDIA', targetKey: 'showreelPosterUrl', targetEl: 'img#heroImg' }
 *   { type: 'VISUAL_EDITOR_READY' }
 *
 * Messages accepted (parent → child):
 *   { type: 'TOGGLE_VISUAL_EDIT', active: true|false }
 *   { type: 'SET_MEDIA_RESULT', targetKey: 'showreelPosterUrl', url: 'https://...' }
 */

(function () {
  'use strict';

  const VisualEditor = {
    isActive: false,
    editingElement: null,
    pendingMediaTarget: null,

    init() {
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin && event.origin !== 'null') {
          // Allow same-origin and file:// during local dev
          if (!window.location.protocol.startsWith('file')) return;
        }

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'TOGGLE_VISUAL_EDIT') {
          this.toggle(!!data.active);
        }

        if (data.type === 'SET_MEDIA_RESULT' && data.url) {
          this.applyMediaResult(data.targetKey, data.url);
        }
      });

      this.injectStyles();

      // Signal ready
      window.parent.postMessage({ type: 'VISUAL_EDITOR_READY' }, '*');
    },

    toggle(active) {
      this.isActive = active;
      document.body.classList.toggle('visual-edit-active', active);
      if (active) {
        this.enable();
      } else {
        this.disable();
      }
    },

    enable() {
      // Text editable elements (data-ve-key attribute or data-i18n)
      const textEls = document.querySelectorAll('[data-ve-key], [data-i18n]');
      textEls.forEach(el => {
        el.classList.add('ve-editable', 've-text');
        el.addEventListener('click', this._handleTextClick);
        el.addEventListener('blur', this._handleTextBlur);
        el.addEventListener('keydown', this._handleKeydown);
      });

      // Image editable elements (data-ve-img attribute)
      const imgEls = document.querySelectorAll('[data-ve-img], img.ve-image');
      imgEls.forEach(el => {
        el.classList.add('ve-editable', 've-image');
        el.addEventListener('click', this._handleImgClick);
      });

      this._addEditBar();
    },

    disable() {
      document.querySelectorAll('.ve-editable').forEach(el => {
        el.classList.remove('ve-editable', 've-text', 've-image');
        el.removeAttribute('contenteditable');
        el.removeEventListener('click', this._handleTextClick);
        el.removeEventListener('blur', this._handleTextBlur);
        el.removeEventListener('keydown', this._handleKeydown);
        el.removeEventListener('click', this._handleImgClick);
      });

      this._removeEditBar();

      if (this.editingElement) {
        this.editingElement.removeAttribute('contenteditable');
        this.editingElement = null;
      }
    },

    _handleTextClick(e) {
      const editor = window.VisualEditorInstance;
      if (!editor || !editor.isActive) return;
      e.preventDefault();
      e.stopPropagation();

      if (editor.editingElement && editor.editingElement !== e.currentTarget) {
        editor.editingElement.blur();
      }
      editor.editingElement = e.currentTarget;
      editor.editingElement.setAttribute('contenteditable', 'true');
      editor.editingElement.focus();
    },

    _handleTextBlur(e) {
      const editor = window.VisualEditorInstance;
      if (!editor || !editor.isActive) return;
      const el = e.currentTarget;
      el.removeAttribute('contenteditable');
      if (editor.editingElement === el) editor.editingElement = null;

      const newText = el.textContent.trim();
      const key = el.getAttribute('data-ve-key') || el.getAttribute('data-i18n');

      if (key && newText) {
        // Try to map key to a known settings field
        const settingsKeyMap = {
          'heroTag': 'heroTag',
          'hero-tag': 'heroTag',
          'heroHeadline': 'heroHeadline',
          'hero-headline': 'heroHeadline',
          'heroSubtitle': 'heroSubtitle',
          'hero-subtitle': 'heroSubtitle',
          'kineticText': 'kineticText',
          'splitText': 'splitText',
          'copyrightText': 'copyrightText',
        };

        if (settingsKeyMap[key]) {
          window.parent.postMessage({
            type: 'SAVE_SETTINGS',
            key: settingsKeyMap[key],
            value: newText
          }, '*');
        } else {
          // Generic i18n key (+ optional block context for page-builder systems)
          const blockEl = el.closest('[data-ve-block]');
          window.parent.postMessage({
            type: 'SAVE_I18N',
            key: key,
            text: newText,
            block: blockEl ? blockEl.getAttribute('data-ve-block') : null
          }, '*');
        }
      }
    },

    _handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.blur();
      }
      if (e.key === 'Escape') {
        e.currentTarget.blur();
      }
    },

    _handleImgClick(e) {
      const editor = window.VisualEditorInstance;
      if (!editor || !editor.isActive) return;
      e.preventDefault();
      e.stopPropagation();

      const el = e.currentTarget;
      const key = el.getAttribute('data-ve-img') || el.id || 'image';
      editor.pendingMediaTarget = { key, el };

      const blockEl = el.closest('[data-ve-block]');
      window.parent.postMessage({
        type: 'PICK_MEDIA',
        targetKey: key,
        targetEl: el.id || null,
        block: blockEl ? blockEl.getAttribute('data-ve-block') : null
      }, '*');
    },

    applyMediaResult(targetKey, url) {
      // If we have a pending target element
      if (this.pendingMediaTarget && this.pendingMediaTarget.key === targetKey) {
        const el = this.pendingMediaTarget.el;
        if (el && el.tagName === 'IMG') {
          el.src = url;
        }
        this.pendingMediaTarget = null;
      } else {
        // Try to find by data-ve-img attribute or data-ve-key
        const el = document.querySelector(`[data-ve-img="${targetKey}"]`) ||
                   document.querySelector(`[data-ve-key="${targetKey}"]`);
        if (el) {
          if (el.tagName === 'IMG') el.src = url;
          else if (el.style !== undefined) el.style.backgroundImage = `url(${url})`;
        }
      }
    },

    _addEditBar() {
      if (document.getElementById('ve-editbar')) return;
      const bar = document.createElement('div');
      bar.id = 've-editbar';
      bar.innerHTML = `
        <span style="font-size:0.75rem; font-weight:700; letter-spacing:0.05em; opacity:0.7;">REDAKTƏ REJİMİ</span>
        <span style="font-size:0.75rem; opacity:0.6; margin-left:0.5rem;">— mətnə basın düzəliş edin, şəkillərə basın media seçin</span>
      `;
      bar.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:99999; background:rgba(106,90,205,0.95); color:#fff; padding:0.4rem 1rem; display:flex; align-items:center; gap:0.5rem; font-family:sans-serif; backdrop-filter:blur(8px);';
      document.body.prepend(bar);
    },

    _removeEditBar() {
      const bar = document.getElementById('ve-editbar');
      if (bar) bar.remove();
    },

    injectStyles() {
      if (document.getElementById('ve-core-styles')) return;
      const style = document.createElement('style');
      style.id = 've-core-styles';
      style.textContent = `
        .visual-edit-active .ve-editable {
          outline: 2px dashed rgba(106,90,205,0.6) !important;
          outline-offset: 3px !important;
          cursor: pointer !important;
          transition: outline 0.2s ease, background 0.2s ease;
        }
        .visual-edit-active .ve-editable:hover {
          outline: 2px solid rgba(106,90,205,1) !important;
          background: rgba(106,90,205,0.08) !important;
        }
        .visual-edit-active .ve-editable[contenteditable="true"] {
          outline: 2px solid #00c853 !important;
          background: rgba(0,200,83,0.07) !important;
          cursor: text !important;
        }
        .visual-edit-active .ve-image {
          outline: 2px dashed rgba(255,144,0,0.7) !important;
          cursor: crosshair !important;
        }
        .visual-edit-active .ve-image:hover {
          outline: 2px solid rgba(255,144,0,1) !important;
          opacity: 0.85;
        }
        .visual-edit-active .ve-image::after {
          content: '📷';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%);
          font-size: 2rem;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Bind handlers properly
  VisualEditor._handleTextClick = VisualEditor._handleTextClick.bind(VisualEditor);
  VisualEditor._handleTextBlur = VisualEditor._handleTextBlur.bind(VisualEditor);
  VisualEditor._handleKeydown = VisualEditor._handleKeydown.bind(VisualEditor);
  VisualEditor._handleImgClick = VisualEditor._handleImgClick.bind(VisualEditor);

  // Expose globally
  window.VisualEditorInstance = VisualEditor;
  window.VisualEditor = VisualEditor;

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VisualEditor.init());
  } else {
    VisualEditor.init();
  }

})();
