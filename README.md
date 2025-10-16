# Book-Notes-Vault

A lightweight, offline-first web app to catalog books and capture reading notes. Data is stored locally in the browser via `localStorage`, so you own your data and can export/import as needed.

## Overview

- **Purpose**: Track books, statuses, ratings, tags, and short notes/quotes.
- **Stack**: Plain HTML/CSS/JS. No build tools. Runs in any modern browser.
- **Persistence**: `localStorage` under key `bnv_items_v1`.

## Project Structure

```
.
├─ index.html            # Home: search and list
├─ form.html             # Add/Edit item form
├─ dashboard.html        # Stats, popular tags, recent notes
├─ about.html            # About + contact form (local only)
├─ css/
│  └─ style.css         # Dark/Light theming, layout, components
├─ js/
│  ├─ storage.js        # Data layer (localStorage), search, stats
│  ├─ validation.js     # Form validation and error display
│  ├─ dom.js            # DOM helpers and `bookCard()` component
│  ├─ main.js           # Page initializers and UI wiring
│  └─ utils.js          # Lightweight utility helpers (optional)
└─ assets/              # Images/icons (if any)
```

## Features

- **Add/Edit books** via `form.html` with validation from `AppValidation.validateItem()`.
- **Local persistence** with `AppStorage.addOrUpdate()`, `AppStorage.getAll()`, `AppStorage.remove()` in `js/storage.js`.
- **Search and filters** on `index.html`:
  - Text query across title/author/notes/tags via `AppStorage.search()`.
  - Tag filter supports comma-separated input.
  - Status filter: `to-read`, `reading`, `read`.
- **Dashboard insights** via `AppStorage.stats()`:
  - Totals by status, top tags, and recent updates.
- **Tags**: normalized to lowercase and de-duplicated.
- **Ratings**: 1–5 (optional) with star rendering in `AppDom.bookCard()`.
- **Confirm delete modal** with backdrop click and `Escape` to close.
- **Theme toggle** (Light/Dark) persisted under `bnv_theme`.

## Setup

1. Clone or download this repository.
2. Open `index.html` directly in your browser. No server or build step required.
3. Ensure `localStorage` is enabled in your browser.

### Optional: Seed sample data

You can seed example items from DevTools Console:

```js

AppStorage.maybeSeed();
```

## Usage Guide

- **Add a book**: Open `form.html`, fill in details, and Save.
- **Edit a book**: From a card, click Edit; or open `form.html?id=...` directly.
- **Delete a book**: Use the Delete button on a card, confirm in the modal.
- **Search**: Use the search input; filter by tags (comma-separated) and status.
- **Theme**: Use the header toggle; preference is saved.

## Regex Catalog

- **Date (YYYY-MM-DD)** — used in `js/validation.js` for `dateAdded`:

```regex
^\d{4}-\d{2}-\d{2}$
```

Notes:
- Validates format only (e.g., `2025-02-31` will pass format but is not a real date).

## Keyboard Map

- **Escape**: When the confirm modal is open, closes the modal (see `ensureModal()` and key handler in `js/main.js`).
- Standard form behaviors apply (Enter to submit where applicable).

## Accessibility Notes

- **Modal**: Uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and moves focus to the safe option ("No"). Backdrop click and `Escape` close the dialog.
- **Theme toggle**: Button includes `aria-label`.
- **Color contrast**: Themes and component tokens are centralized in CSS variables for easier auditing/tuning.

## Testing Instructions

- **Manual testing**
  - Add, edit, and delete items; verify list and dashboard update.
  - Test search: title/author/notes match; tag and status filters work.
  - Validate form errors: empty title, invalid pages, long fields, invalid date format.
  - Check theme toggle persists across reloads.
  - Confirm modal closes via button, backdrop click, and `Escape`.

- **LocalStorage state**
  - Data key: `bnv_items_v1`.
  - Backup: In DevTools Console: `localStorage.getItem('bnv_items_v1')` and save the returned JSON string.
  - Restore: `localStorage.setItem('bnv_items_v1', '<your-json-string>')` then refresh.

- **Responsive UI**
  - Verify layouts at widths above/below 800px (`@media` rules in `css/style.css`).

## Notes for Contributors

- Keep imports in HTML in this order for predictable globals:
  1. `js/storage.js`
  2. `js/validation.js`
  3. `js/dom.js`
  4. `js/main.js`
- Avoid breaking global names: `window.AppStorage`, `window.AppValidation`, `window.AppDom`, `window.AppUtils`.
## Demo video link
https://vimeo.com/1127977808?share=copy&fl=sv&fe=ci
