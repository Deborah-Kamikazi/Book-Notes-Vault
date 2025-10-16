;(() => {
  function validateItem({ title, author, notes, pages, tag, dateAdded, status, rating }) {
    const errors = {};
    {
      const t = String(title || '').trim();
      const titleErrors = [];
      if (!t) titleErrors.push('Title is required');
      if (t && !/^[A-Z]/.test(t)) titleErrors.push('Title must start with a capital letter');
      if (t && t.includes(',')) titleErrors.push('Title cannot contain commas');
      if (titleErrors.length) errors.title = titleErrors.join('. ');
    }
    // Author
    if (!String(author || '').trim()) errors.author = 'Author is required';
    else if (author.length > 120) errors.author = 'Author is too long';
    // Notes
    if (!String(notes || '').trim()) errors.notes = 'Notes are required';
    else if (notes.length > 5000) errors.notes = 'Notes too long';
    // Pages
    if (pages == null || pages === '') errors.pages = 'Pages are required';
    else if (!Number.isFinite(Number(pages)) || Number(pages) <= 0) errors.pages = 'Pages must be a positive number';
    // Tag
    if (!String(tag || '').trim()) errors.tag = 'Tag is required';
    else if (tag.length > 50) errors.tag = 'Tag is too long';
    // Status
    if (!String(status || '').trim()) errors.status = 'Status is required';
    // Rating
    if (rating == null || String(rating) === '') errors.rating = 'Rating is required';
    // Date
    if (!String(dateAdded || '').trim()) errors.dateAdded = 'Date is required';
    else {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(dateAdded));
      if (!ok) errors.dateAdded = 'Date must be YYYY-MM-DD';
    }
    return errors;
  }

  function showErrors(map) {
    for (const [k, v] of Object.entries(map || {})) {
      const el = document.getElementById(`e-${k}`);
      if (el) el.textContent = v || '';
      const input = document.getElementById(k);
      if (input) {
        if (v) {
          input.setAttribute('aria-invalid', 'true');
          input.setAttribute('aria-describedby', `e-${k}`);
        } else {
          input.removeAttribute('aria-invalid');
          // Keep aria-describedby if you prefer persistent relation; otherwise unset when no error
          input.removeAttribute('aria-describedby');
        }
      }
    }
  }

  window.AppValidation = { validateItem, showErrors };
})();
