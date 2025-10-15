;(() => {
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v != null) el.setAttribute(k, v);
    }
    for (const child of children.flat()) {
      if (child == null) continue;
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else el.appendChild(child);
    }
    return el;
  }

  function tagBadge(t) { return h('span', { class: 'tag' }, t); }

  function ratingStars(n) {
    if (!n) return '';
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  function bookCard(it, { onEdit } = {}) {
    return h('div', { class: 'book-card' },
      h('h3', {}, it.title || 'Untitled'),
      h('div', { class: 'meta' }, [
        it.author ? `by ${it.author}` : null,
        it.rating ? ` • ${ratingStars(it.rating)}` : null,
        it.status ? ` • ${it.status}` : null
      ].filter(Boolean).join('')),
      it.notes ? h('div', { class: 'help' }, it.notes.slice(0, 200)) : null,
      h('div', { class: 'tags' }, (it.tags || []).map(tagBadge)),
      h('div', { class: 'actions' }, [
        h('a', { href: './form.html?id=' + encodeURIComponent(it.id), class: 'btn primary' }, 'Edit'),
        h('button', { class: 'btn danger', 'data-action': 'delete', 'data-id': String(it.id) }, 'Delete')
      ])
    );
  }

  function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  window.AppDom = { h, tagBadge, bookCard, setYear };
})();
