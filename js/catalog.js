/* catalog.js - Product grid (POS) + card grid (Catalog) + CRUD + chips */
(function (global) {
  'use strict';

  const Catalog = {
    activeCategory: 'all',

    // Get unique categories from products
    getCategories() {
      const cats = new Set();
      Store.getProducts().forEach(p => { if (p.category) cats.add(p.category); });
      return ['all', ...Array.from(cats)];
    },

    // Render kategori chips
    renderChips(containerId) {
      const el = document.getElementById(containerId);
      if (!el) return;
      const cats = this.getCategories();
      el.innerHTML = cats.map(c => `
        <button class="chip ${c === this.activeCategory ? 'active' : ''}" data-cat="${escapeAttr(c)}">
          ${c === 'all' ? 'Semua' : escapeHtml(c)}
        </button>
      `).join('');
    },

    // Apply category filter on top of search term
    applyFilter(term) {
      let list = Store.getProducts();
      if (this.activeCategory !== 'all') {
        list = list.filter(p => (p.category || '') === this.activeCategory);
      }
      if (term) {
        const t = term.toLowerCase();
        list = list.filter(p =>
          (p.name || '').toLowerCase().includes(t) ||
          (p.barcode || '').toLowerCase().includes(t) ||
          (p.category || '').toLowerCase().includes(t)
        );
      }
      return list;
    },

    // Render POS product grid
    renderPosGrid(list) {
      const grid = document.getElementById('pos-grid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">Tiada produk dijumpai.</p>';
        return;
      }
      grid.innerHTML = list.map(p => `
        <button class="product-card ${p.stock <= 0 ? 'out' : ''}" data-id="${p.id}"
          ${p.stock <= 0 ? 'disabled' : ''}>
          <span class="prod-emoji">${emojiFor(p.category)}</span>
          <span class="prod-name">${escapeHtml(p.name)}</span>
          <span class="prod-cat">${escapeHtml(p.category || '-')}</span>
          <span class="prod-price">RM ${p.price.toFixed(2)}</span>
          <span class="prod-stock">Stok: ${p.stock}</span>
        </button>
      `).join('');
    },

    // Render Catalog card grid
    renderCatalogGrid(list) {
      const grid = document.getElementById('catalog-grid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">Tiada produk. Klik "+ Tambah".</p>';
        return;
      }
      grid.innerHTML = list.map((p, i) => {
        const stockClass = p.stock <= 0 ? 'out' : (p.stock <= 5 ? 'low' : 'ok');
        const stockLabel = p.stock <= 0 ? 'Habis stok' : `Stok: ${p.stock}`;
        return `
          <div class="cat-card">
            <div class="cat-card-head">
              <span class="name">${escapeHtml(p.name)}</span>
              <div class="cat-actions">
                <button class="edit" data-id="${p.id}" title="Edit">✎</button>
                <button class="del" data-id="${p.id}" title="Padam">×</button>
              </div>
            </div>
            <span class="cat-meta">${escapeHtml(p.category || '-')} · ${escapeHtml(p.barcode || 'tiada barcode')}</span>
            <span class="cat-price">RM ${p.price.toFixed(2)}</span>
            <span class="cat-stock ${stockClass}">${stockLabel}</span>
          </div>
        `;
      }).join('');
    },

    // Open modal for add or edit
    openModal(product) {
      const modal = document.getElementById('product-modal');
      document.getElementById('modal-title').textContent = product ? 'Edit Produk' : 'Produk Baru';
      document.getElementById('prod-id').value = product ? product.id : '';
      document.getElementById('prod-name').value = product ? product.name : '';
      document.getElementById('prod-barcode').value = product ? product.barcode : '';
      document.getElementById('prod-category').value = product ? product.category : '';
      document.getElementById('prod-price').value = product ? product.price : '';
      document.getElementById('prod-stock').value = product ? product.stock : 0;
      this.refreshDatalist();
      modal.classList.remove('hidden');
    },

    closeModal() {
      document.getElementById('product-modal').classList.add('hidden');
      document.getElementById('product-form').reset();
      document.getElementById('prod-id').value = '';
    },

    refreshDatalist() {
      const dl = document.getElementById('cat-list');
      if (!dl) return;
      const cats = this.getCategories().filter(c => c !== 'all');
      dl.innerHTML = cats.map(c => `<option value="${escapeAttr(c)}">`).join('');
    },

    handleSubmit(e) {
      e.preventDefault();
      const id = document.getElementById('prod-id').value;
      const data = {
        name: document.getElementById('prod-name').value.trim(),
        barcode: document.getElementById('prod-barcode').value.trim(),
        category: document.getElementById('prod-category').value.trim(),
        price: parseFloat(document.getElementById('prod-price').value) || 0,
        stock: parseInt(document.getElementById('prod-stock').value, 10) || 0
      };
      if (!data.name) { alert('Nama produk wajib diisi.'); return; }
      if (id) data.id = id;
      Store.saveProduct(data);
      this.closeModal();
      this.refreshAll();
    },

    refreshAll() {
      const all = Store.getProducts();
      const filtered = this.applyFilter(
        (document.getElementById('pos-search')?.value || '').trim()
      );
      const catFiltered = this.applyFilter(
        (document.getElementById('catalog-search')?.value || '').trim()
      );
      this.renderChips('pos-chips');
      this.renderChips('catalog-chips');
      this.renderPosGrid(filtered);
      this.renderCatalogGrid(catFiltered);
      if (global.Cart) Cart.updateTotals();
    }
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function emojiFor(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('minum')) return '🥤';
    if (c.includes('makan')) return '🍽️';
    if (c.includes('snack') || c.includes('kuih')) return '🍪';
    if (c.includes('rokok') || c.includes('tisu') || c.includes('lain')) return '🧴';
    return '📦';
  }

  global.Catalog = Catalog;
})(window);
