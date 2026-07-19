/* catalog.js - Product grid (POS) + table (Catalog) + CRUD */
(function (global) {
  'use strict';

  const Catalog = {
    // Render POS product grid (filtered by search)
    renderPosGrid(list) {
      const grid = document.getElementById('pos-grid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">Tiada produk dijumpai.</p>';
        return;
      }
      grid.innerHTML = list.map(p => `
        <button class="product-card ${p.stock <= 0 ? 'out' : ''}" data-id="${p.id}"
          ${p.stock <= 0 ? 'disabled' : ''}>
          <span class="prod-emoji">📦</span>
          <span class="prod-name">${escapeHtml(p.name)}</span>
          <span class="prod-cat">${escapeHtml(p.category || '-')}</span>
          <span class="prod-price">RM ${p.price.toFixed(2)}</span>
          <span class="prod-stock">Stok: ${p.stock}</span>
        </button>
      `).join('');
    },

    // Render Catalog table
    renderTable(list) {
      const body = document.getElementById('catalog-body');
      if (!list.length) {
        body.innerHTML = '<tr><td colspan="7" class="empty">Tiada produk. Klik "+ Produk Baru".</td></tr>';
        return;
      }
      body.innerHTML = list.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.barcode || '-')}</td>
          <td>${escapeHtml(p.category || '-')}</td>
          <td>${p.price.toFixed(2)}</td>
          <td class="${p.stock <= 5 ? 'low-stock' : ''}">${p.stock}</td>
          <td class="actions">
            <button class="btn-edit" data-id="${p.id}">Edit</button>
            <button class="btn-delete" data-id="${p.id}">Padam</button>
          </td>
        </tr>
      `).join('');
    },

    // Filter products by search term (name or barcode)
    filter(term) {
      const all = Store.getProducts();
      if (!term) return all;
      const t = term.toLowerCase();
      return all.filter(p =>
        (p.name || '').toLowerCase().includes(t) ||
        (p.barcode || '').toLowerCase().includes(t) ||
        (p.category || '').toLowerCase().includes(t)
      );
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
      modal.classList.remove('hidden');
    },

    closeModal() {
      document.getElementById('product-modal').classList.add('hidden');
      document.getElementById('product-form').reset();
      document.getElementById('prod-id').value = '';
    },

    // Handle form submit
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
      if (!data.name) {
        alert('Nama produk wajib diisi.');
        return;
      }
      if (id) data.id = id;
      Store.saveProduct(data);
      this.closeModal();
      this.refreshAll();
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  Catalog.refreshAll = function () {
    Catalog.renderPosGrid(Store.getProducts());
    Catalog.renderTable(Store.getProducts());
    if (global.Cart) Cart.updateTotals();
  };

  global.Catalog = Catalog;
})(window);
