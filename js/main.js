;(() => {
  const { AppStorage, AppValidation, AppDom } = window;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // THEME TOGGLE
  const THEME_KEY = 'bnv_theme';
  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; }
  }
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? 'Dark' : 'Light';
  }
  function mountThemeToggle() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('.theme-toggle')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.addEventListener('click', () => {
      const next = (getSavedTheme() === 'light') ? 'dark' : 'light';
      applyTheme(next);
    });
    btn.textContent = getSavedTheme() === 'light' ? 'Dark' : 'Light';
    nav.appendChild(btn);
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }
  function debounce(fn, ms = 200) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function renderResults(list) {
    const root = $('#results'); if (!root) return;
    root.innerHTML = '';
    if (AppDom?.bookCard) {
      for (const it of list) {
       const card = AppDom.bookCard(it);
        root.appendChild(card);
      }
    } else {
      for (const it of list) { const d = document.createElement('div'); d.textContent = it.title || 'Untitled'; root.appendChild(d); }
    }
  }

  function applySearch() {
    const q = $('#search-input')?.value || '';
    const tags = AppStorage.parseTagInput($('#tag-filter')?.value || '');
    const status = $('#status-filter')?.value || '';
    const list = AppStorage.search({ q, tags, status });
    renderResults(list);
  }

  function initHome() {
    AppStorage?.maybeSeed?.();
    const inputs = ['#search-input', '#tag-filter', '#status-filter'];
    const run = debounce(applySearch, 150);
    for (const s of inputs) $(s)?.addEventListener('input', run);
    applySearch();
    // Delegated delete handler for catalog list
    const results = document.getElementById('results');
    if (results && !results.__bnvDelegatedDelete) {
      results.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const btn = t.closest('button[data-action="delete"][data-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        // Find a title if available
        const card = btn.closest('.book-card');
        const titleEl = card?.querySelector('h3, .book-title');
        const title = titleEl?.textContent?.trim() || 'this item';
        requestDelete(id, title, () => applySearch());
      });
      results.__bnvDelegatedDelete = true;
    }
  }

  function fillForm(it) {
    if (!it) return;
    $('#item-id').value = it.id;
    $('#title').value = it.title || '';
    $('#author').value = it.author || '';
    $('#notes').value = it.notes || '';
    $('#tags').value = (it.tags || []).join(', ');
    $('#status').value = it.status || 'to-read';
    $('#rating').value = it.rating || '';
  }

  function initForm() {
    AppStorage?.maybeSeed?.();
    const id = getParam('id');
    if (id) {
      const existing = AppStorage?.getById?.(id);
      if (existing) fillForm(existing);
    }
    const form = $('#item-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = {
        id: $('#item-id').value || undefined,
        title: $('#title').value,
        author: $('#author').value,
        notes: $('#notes').value,
        tags: (AppStorage?.parseTagInput?.($('#tags').value)) || [],
        status: $('#status').value || 'to-read',
        rating: $('#rating').value ? Number($('#rating').value) : undefined,
      };
      const errs = (AppValidation?.validateItem?.(item)) || {};
      AppValidation?.showErrors?.({ title: errs.title || '', author: errs.author || '', notes: errs.notes || '', tags: errs.tags || '' });
      if (Object.keys(errs).length) return;
      AppStorage?.addOrUpdate?.(item);
      window.location.href = './index.html';
    });
  }

  function renderDashboard() {
    const s = AppStorage?.stats?.() || { total: 0, readCnt: 0, readingCnt: 0, toReadCnt: 0, tagList: [], recent: [] };
    $('#stat-total').textContent = String(s.total);
    $('#stat-read').textContent = String(s.readCnt);
    $('#stat-reading').textContent = String(s.readingCnt);
    $('#stat-to-read').textContent = String(s.toReadCnt);
    const tagsRoot = $('#top-tags');
    if (tagsRoot) {
      tagsRoot.innerHTML = '';
      if (AppDom?.h) { for (const [tag, count] of s.tagList) tagsRoot.appendChild(AppDom.h('span', { class: 'tag' }, `${tag} (${count})`)); }
      else { for (const [tag, count] of s.tagList) { const el = document.createElement('span'); el.className = 'tag'; el.textContent = `${tag} (${count})`; tagsRoot.appendChild(el); } }
    }
    const recentRoot = $('#recent');
    if (recentRoot) {
      recentRoot.innerHTML = '';
      if (AppDom?.bookCard) {
        for (const it of s.recent) {
          const card = AppDom.bookCard(it);
          recentRoot.appendChild(card);
        }
      }
    }
  }

  function initDashboard() {
    AppStorage?.maybeSeed?.();
    renderDashboard();
    // Delegated delete handler for recent list
    const recent = document.getElementById('recent');
    if (recent && !recent.__bnvDelegatedDelete) {
      recent.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const btn = t.closest('button[data-action="delete"][data-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        const card = btn.closest('.book-card');
        const titleEl = card?.querySelector('h3, .book-title');
        const title = titleEl?.textContent?.trim() || 'this item';
        requestDelete(id, title, () => renderDashboard());
      });
      recent.__bnvDelegatedDelete = true;
    }
  }

  function initAbout() {
    const form = $('#contact-form');
    const status = $('#c-status');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#c-name').value.trim();
      const email = $('#c-email').value.trim();
      const msg = $('#c-msg').value.trim();
      if (!name || !email || !msg) {
        status.textContent = 'Please fill out all fields.';
        return;
      }
      status.textContent = 'Thanks! Your message has been noted locally (no backend).';
      form.reset();
    });
  }

  function init() {
    // Footer year safe-set
    const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());
    // Theme
    applyTheme(getSavedTheme());
    mountThemeToggle();
    ensureModal();
    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    else if (page === 'form') initForm();
    else if (page === 'dashboard') initDashboard();
    else if (page === 'about') initAbout();
  }

  // CONFIRM MODAL
  let modalEls = null;
  function ensureModal() {
    if (modalEls) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h4 id="confirm-title">Confirm Delete</h4>
        <div id="confirm-message" class="help"></div>
        <div class="modal-actions">
          <button id="confirm-no" class="btn">No</button>
          <button id="confirm-yes" class="btn danger">Yes, Delete</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    const msg = backdrop.querySelector('#confirm-message');
    const yes = backdrop.querySelector('#confirm-yes');
    const no = backdrop.querySelector('#confirm-no');
    function hide() { backdrop.classList.remove('show'); }
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) hide(); });
    document.addEventListener('keydown', (e) => { if (backdrop.classList.contains('show') && e.key === 'Escape') hide(); });
    modalEls = { backdrop, msg, yes, no, hide };
  }

  function confirmDelete(message, onYes) {
    ensureModal();
    if (!modalEls || !modalEls.backdrop) {
      // Fallback to native confirm if modal not available
      if (window.confirm(message)) onYes && onYes();
      return;
    }
    modalEls.msg.textContent = message;
    modalEls.backdrop.classList.add('show');
    // Move focus to No button for accessibility
    setTimeout(() => modalEls.no?.focus?.(), 0);
    const clean = () => {
      modalEls.yes.removeEventListener('click', yesHandler);
      modalEls.no.removeEventListener('click', noHandler);
    };
    function yesHandler() { onYes && onYes(); modalEls.hide(); clean(); }
    function noHandler() { modalEls.hide(); clean(); }
    modalEls.yes.addEventListener('click', yesHandler);
    modalEls.no.addEventListener('click', noHandler);
  }

  // Reusable delete flow: confirm, remove from storage, then run a callback to refresh UI
  function requestDelete(id, title, after) {
    const name = title || 'this item';
    confirmDelete(`Are you sure you want to delete "${name}"?`, () => {
      AppStorage?.remove?.(id);
      if (typeof after === 'function') after();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
