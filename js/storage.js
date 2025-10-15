// Storage module: manages items in localStorage
// Item shape:
// {
//   id: string,
//   title: string,
//   author?: string,
//   notes?: string,
//   tags: string[],
//   status: 'to-read'|'reading'|'read',
//   rating?: number,
//   createdAt: number,
//   updatedAt: number
// }

;(() => {
  const KEY = 'bnv_items_v1';
  const SCHEMA = 1;

  function now() { return Date.now(); }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { schema: SCHEMA, items: [] };
      const parsed = JSON.parse(raw);
      if (!parsed.schema) parsed.schema = SCHEMA; // basic forward compat
      if (!Array.isArray(parsed.items)) parsed.items = [];
      return parsed;
    } catch {
      return { schema: SCHEMA, items: [] };
    }
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  function normalizeTags(tags) {
    return (tags || [])
      .map(t => String(t).trim().toLowerCase())
      .filter(Boolean)
      .filter((t, i, a) => a.indexOf(t) === i);
  }

  function getAll() { return read().items; }

  function getById(id) { return getAll().find(i => i.id === id) || null; }

  function saveAll(items) { write({ schema: SCHEMA, items }); }

  function addOrUpdate(item) {
    const state = read();
    const nowTs = now();
    if (!item.id) {
      item.id = uid();
      item.createdAt = nowTs;
    }
    item.updatedAt = nowTs;
    item.tags = normalizeTags(item.tags);
    const idx = state.items.findIndex(i => i.id === item.id);
    if (idx >= 0) state.items[idx] = item; else state.items.unshift(item);
    write(state);
    return item;
  }

  function remove(id) {
    const state = read();
    const next = state.items.filter(i => i.id !== id);
    write({ schema: SCHEMA, items: next });
  }

  function parseTagInput(value) {
    return normalizeTags(String(value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean));
  }

  function search({ q = '', tags = [], status = '' } = {}) {
    const query = String(q || '').toLowerCase();
    const tagSet = new Set(normalizeTags(tags));
    const wantStatus = String(status || '').toLowerCase();
    return getAll().filter(it => {
      if (wantStatus && it.status !== wantStatus) return false;
      if (tagSet.size) {
        const hasAll = [...tagSet].every(t => it.tags.includes(t));
        if (!hasAll) return false;
      }
      if (!query) return true;
      const hay = [it.title, it.author, it.notes, it.tags.join(' ')].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }

  function stats() {
    const items = getAll();
    const total = items.length;
    const readCnt = items.filter(i => i.status === 'read').length;
    const readingCnt = items.filter(i => i.status === 'reading').length;
    const toReadCnt = items.filter(i => i.status === 'to-read').length;
    const tags = {};
    for (const it of items) for (const t of it.tags) tags[t] = (tags[t] || 0) + 1;
    const tagList = Object.entries(tags).sort((a,b) => b[1]-a[1]).slice(0, 20);
    const recent = [...items].sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 8);
    return { total, readCnt, readingCnt, toReadCnt, tagList, recent };
  }

  function maybeSeed() {
    const items = getAll();
    if (items.length) return;
    const seed = [
      {
        title: 'Deep Work', author: 'Cal Newport',
        notes: 'Focus without distraction on cognitively demanding tasks.',
        tags: ['productivity','focus','non-fiction'], status: 'read', rating: 5
      },
      {
        title: 'Atomic Habits', author: 'James Clear',
        notes: 'Tiny changes, remarkable results. Systems over goals.',
        tags: ['habits','self-improvement'], status: 'read', rating: 5
      },
      {
        title: 'Clean Code', author: 'Robert C. Martin',
        notes: 'Principles for writing readable, maintainable code.',
        tags: ['programming','craft'], status: 'reading', rating: 4
      }
    ];
    for (const s of seed) addOrUpdate({ ...s });
  }

  // Expose API
  window.AppStorage = {
    getAll, getById, saveAll, addOrUpdate, remove, search, stats, parseTagInput, maybeSeed
  };
})();
