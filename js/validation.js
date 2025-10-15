;(() => {
  function validateItem({ title, author, notes }) {
    const errors = {};
    if (!String(title || '').trim()) errors.title = 'Title is required';
    if (author && author.length > 120) errors.author = 'Author is too long';
    if (notes && notes.length > 5000) errors.notes = 'Notes too long';
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
