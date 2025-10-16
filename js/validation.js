;(() => {
  function validateItem({ title, author, notes, pages, tag, dateAdded }) {
    const errors = {};
    if (!String(title || '').trim()) errors.title = 'Title is required';
    if (author && author.length > 120) errors.author = 'Author is too long';
    if (notes && notes.length > 5000) errors.notes = 'Notes too long';
    if (pages != null && pages !== '' && (!Number.isFinite(Number(pages)) || Number(pages) <= 0)) errors.pages = 'Pages must be a positive number';
    if (tag && tag.length > 50) errors.tag = 'Tag is too long';
    if (dateAdded) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(dateAdded));
      if (!ok) errors.dateAdded = 'Date must be YYYY-MM-DD';
    }
    return errors;
  }

  function showErrors(map) {
    for (const [k, v] of Object.entries(map || {})) {
      const el = document.getElementById(`e-${k}`);
      if (el) el.textContent = v || '';
    }
  }

  window.AppValidation = { validateItem, showErrors };
})();
