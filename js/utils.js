;(() => {
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function debounce(fn, ms = 200) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
  function getParam(name) { const url = new URL(window.location.href); return url.searchParams.get(name); }
  function download(filename, text) { const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
  function setYear() { const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear()); }
  window.AppUtils = { $, $all, debounce, getParam, download, setYear };
})();
