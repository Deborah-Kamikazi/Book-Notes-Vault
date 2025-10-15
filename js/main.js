;(() => {
  const { AppStorage, AppValidation, AppDom } = window;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

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
    for (const it of list) {
      const card = AppDom.bookCard(it, {
        onDelete: (id) => { AppStorage.remove(id); applySearch(); }
      });
      root.appendChild(card);
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
    AppStorage.maybeSeed();
    const inputs = ['#search-input', '#tag-filter', '#status-filter'];
    const run = debounce(applySearch, 150);
    for (const s of inputs) $(s)?.addEventListener('input', run);
    applySearch();
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
    AppStorage.maybeSeed();
    const id = getParam('id');
    if (id) {
      const existing = AppStorage.getById(id);
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
        tags: AppStorage.parseTagInput($('#tags').value),
        status: $('#status').value || 'to-read',
        rating: $('#rating').value ? Number($('#rating').value) : undefined,
      };
      const errs = AppValidation.validateItem(item);
      AppValidation.showErrors({ title: errs.title || '', author: errs.author || '', notes: errs.notes || '', tags: errs.tags || '' });
      if (Object.keys(errs).length) return;
      AppStorage.addOrUpdate(item);
      window.location.href = './index.html';
    });
  }

  function initDashboard() {
    AppStorage.maybeSeed();
    const s = AppStorage.stats();
    $('#stat-total').textContent = String(s.total);
    $('#stat-read').textContent = String(s.readCnt);
    $('#stat-reading').textContent = String(s.readingCnt);
    $('#stat-to-read').textContent = String(s.toReadCnt);
    const tagsRoot = $('#top-tags');
    if (tagsRoot) {
      tagsRoot.innerHTML = '';
      for (const [tag, count] of s.tagList) {
        const el = AppDom.h('span', { class: 'tag' }, `${tag} (${count})`);
        tagsRoot.appendChild(el);
      }
    }
    const recentRoot = $('#recent');
    if (recentRoot) {
      recentRoot.innerHTML = '';
      for (const it of s.recent) recentRoot.appendChild(AppDom.bookCard(it));
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
    AppDom.setYear();
    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    else if (page === 'form') initForm();
    else if (page === 'dashboard') initDashboard();
    else if (page === 'about') initAbout();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
