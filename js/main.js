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

  // SETTINGS HELPERS
  const GOAL_KEY = 'bnv_reading_goal_v1';
  function loadGoal() {
    try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null'); } catch { return null; }
  }
  function saveGoal(goal) {
    try { localStorage.setItem(GOAL_KEY, JSON.stringify(goal)); } catch {}
  }
  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
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

  function initSettings() {
    // Prefill goal
    const now = new Date();
    const yr = String(now.getFullYear());
    const yearEl = document.getElementById('goal-year');
    const countEl = document.getElementById('goal-count');
    const statusEl = document.getElementById('goal-status');
    if (yearEl && !yearEl.value) yearEl.value = yr;
    const goal = loadGoal();
    if (goal && yearEl && countEl) {
      yearEl.value = String(goal.year || yr);
      countEl.value = String(goal.count || '');
    }
    document.getElementById('btn-save-goal')?.addEventListener('click', () => {
      const y = Number(yearEl?.value || yr);
      const c = Number(countEl?.value || 0);
      saveGoal({ year: y, count: c });
      if (statusEl) statusEl.textContent = `Saved: ${c} books in ${y}`;
    });

    // Export
    document.getElementById('btn-export')?.addEventListener('click', () => {
      const data = {
        schema: 1,
        exportedAt: new Date().toISOString(),
        items: AppStorage?.getAll?.() || [],
        settings: { goal: loadGoal() }
      };
      download('book-notes-vault-backup.json', JSON.stringify(data, null, 2));
    });

    // Import
    const importInput = document.getElementById('file-import');
    const importStatus = document.getElementById('import-status');
    importInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.items)) AppStorage?.saveAll?.(parsed.items);
        if (parsed.settings?.goal) saveGoal(parsed.settings.goal);
        if (importStatus) importStatus.textContent = 'Import complete. Reloading...';
        setTimeout(() => window.location.reload(), 400);
      } catch (err) {
        if (importStatus) importStatus.textContent = 'Import failed: invalid JSON';
      } finally {
        importInput.value = '';
      }
    });

    // Run tests (simple validation pass)
    document.getElementById('btn-run-tests')?.addEventListener('click', () => {
      const items = AppStorage?.getAll?.() || [];
      const bad = [];
      for (const it of items) {
        const errs = (window.AppValidation?.validateItem?.(it)) || {};
        if (Object.keys(errs).length) bad.push({ id: it.id, title: it.title, errs });
      }
      if (bad.length) alert(`Found ${bad.length} item(s) with issues. Check console.`);
      else alert('All items passed basic validation.');
      console.log('Validation results:', bad);
    });

    // Clear all data
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      confirmDelete('This will delete ALL books and settings. Continue?', () => {
        // Clear items by saving empty list and wipe goal
        AppStorage?.saveAll?.([]);
        saveGoal(null);
        window.location.reload();
      });
    });
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
    $('#pages') && ($('#pages').value = it.pages != null ? String(it.pages) : '');
    $('#tag') && ($('#tag').value = it.tag || '');
    $('#notes').value = it.notes || '';
    $('#status').value = it.status || 'to-read';
    $('#rating').value = it.rating || '';
    if ($('#dateAdded')) {
      // Expecting YYYY-MM-DD; if created from timestamp, convert
      const da = it.dateAdded || '';
      $('#dateAdded').value = da;
    }
  }

  function initForm() {
    AppStorage?.maybeSeed?.();
    const id = getParam('id');
    if (id) {
      const existing = AppStorage?.getById?.(id);
      if (existing) fillForm(existing);
    }
    const form = $('#item-form');
    // Validation UX: only show errors after the first submit attempt
    const saveBtn = form?.querySelector('button[type="submit"]');
    let showErrorsNow = false;
    function readItemFromForm() {
      return {
        id: $('#item-id').value || undefined,
        title: $('#title').value,
        author: $('#author').value,
        pages: $('#pages')?.value ? Number($('#pages').value) : undefined,
        tag: $('#tag')?.value || undefined,
        notes: $('#notes').value,
        status: $('#status').value || 'to-read',
        rating: $('#rating').value ? Number($('#rating').value) : undefined,
        dateAdded: $('#dateAdded')?.value || undefined,
      };
    }
    function requiredFilled() {
      if (!form) return false;
      const requiredEls = Array.from(form.querySelectorAll('[required]'));
      return requiredEls.every(el => String(el.value || '').trim().length > 0);
    }
    function updateFormState() {
      if (!form) return;
      const item = readItemFromForm();
      const errs = (AppValidation?.validateItem?.(item)) || {};
      if (showErrorsNow) {
        AppValidation?.showErrors?.({
          title: errs.title || '',
          author: errs.author || '',
          notes: errs.notes || '',
          pages: errs.pages || '',
          tag: errs.tag || '',
          status: errs.status || '',
          rating: errs.rating || '',
          dateAdded: errs.dateAdded || ''
        });
      }
    }
    // No live validation display; errors are shown only on submit
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = readItemFromForm();
      showErrorsNow = true;
      const errs = (AppValidation?.validateItem?.(item)) || {};
      AppValidation?.showErrors?.({ title: errs.title || '', author: errs.author || '', notes: errs.notes || '', pages: errs.pages || '', tag: errs.tag || '', status: errs.status || '', rating: errs.rating || '', dateAdded: errs.dateAdded || '' });
      if (Object.keys(errs).length) {
        // Focus first invalid field to trigger screen reader announcement
        const order = ['title','author','pages','tag','notes','status','rating','dateAdded'];
        const firstKey = order.find(k => errs[k]);
        const firstEl = firstKey ? document.getElementById(firstKey) : null;
        if (firstEl && typeof firstEl.focus === 'function') {
          firstEl.focus({ preventScroll: false });
          if (typeof firstEl.scrollIntoView === 'function') firstEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return;
      }
      // Additionally guard against missing required fields
      if (!requiredFilled()) { updateFormState(); return; }
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
    else if (page === 'settings') initSettings();
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
