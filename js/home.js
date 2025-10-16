;(() => {
  const { $, debounce } = window.AppUtils || {};
  function renderResults(list) {
    const root = $('#results'); if (!root) return;
    root.innerHTML = '';
    if (window.AppDom?.bookCard) {
      for (const it of list) {
        const card = window.AppDom.bookCard(it);
        root.appendChild(card);
      }
    } else {
      for (const it of list) {
        const d = document.createElement('div');
        d.textContent = it.title || 'Untitled';
        root.appendChild(d);
      }
    }
  }
  function applySearch() {
    const q = $('#search-input')?.value || '';
    const tags = window.AppStorage.parseTagInput($('#tag-filter')?.value || '');
    const status = $('#status-filter')?.value || '';
    const list = window.AppStorage.search({ q, tags, status });
    renderResults(list);
  }
  function init() {
    window.AppStorage?.maybeSeed?.();
    const inputs = ['#search-input', '#tag-filter', '#status-filter'];
    const run = debounce(applySearch, 150);
    for (const s of inputs) $(s)?.addEventListener('input', run);
    applySearch();
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
        window.requestDelete(id, title, () => applySearch());
      });
      results.__bnvDelegatedDelete = true;
    }
  }
  window.AppHome = { init };
})();
