/* app.js - Init, tab routing, event wiring, reports */
(function () {
  'use strict';

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
      document.querySelectorAll('.tab-panel').forEach(p =>
        p.classList.toggle('active', p.id === 'tab-' + target)
      );
      if (target === 'reports') renderReports();
      if (target === 'catalog') Catalog.renderTable(Store.getProducts());
      if (target === 'pos') Catalog.renderPosGrid(Store.getProducts());
    });
  });

  // ---------- POS search ----------
  document.getElementById('pos-search').addEventListener('input', (e) => {
    Catalog.renderPosGrid(Catalog.filter(e.target.value));
  });

  // ---------- POS grid click -> add to cart ----------
  document.getElementById('pos-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card || card.disabled) return;
    Cart.add(card.dataset.id);
  });

  // ---------- Cart controls (event delegation) ----------
  document.getElementById('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'inc') Cart.changeQty(id, +1);
    if (act === 'dec') Cart.changeQty(id, -1);
    if (act === 'del') Cart.remove(id);
  });

  // ---------- Cart totals inputs ----------
  ['cart-discount', 'cart-paid'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => Cart.updateTotals());
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('Kosongkan trol?')) Cart.clear();
  });
  document.getElementById('btn-checkout').addEventListener('click', () => Cart.checkout());

  // ---------- Catalog search ----------
  document.getElementById('catalog-search').addEventListener('input', (e) => {
    Catalog.renderTable(Catalog.filter(e.target.value));
  });

  // ---------- Catalog add/edit/delete ----------
  document.getElementById('btn-add-product').addEventListener('click', () => Catalog.openModal(null));

  document.getElementById('catalog-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn = e.target.closest('.btn-delete');
    if (editBtn) {
      const p = Store.getProduct(editBtn.dataset.id);
      Catalog.openModal(p);
    }
    if (delBtn) {
      if (confirm('Padam produk ini?')) {
        Store.deleteProduct(delBtn.dataset.id);
        Catalog.refreshAll();
      }
    }
  });

  document.getElementById('product-form').addEventListener('submit', (e) => Catalog.handleSubmit(e));
  document.getElementById('btn-cancel').addEventListener('click', () => Catalog.closeModal());

  // ---------- Receipt modal ----------
  document.getElementById('btn-receipt-close').addEventListener('click', () => {
    document.getElementById('receipt-modal').classList.add('hidden');
  });
  document.getElementById('btn-print').addEventListener('click', () => {
    const html = document.getElementById('receipt-content').innerHTML;
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(`
      <html><head><title>Resit</title>
      <style>
        body{font-family:monospace;padding:12px;font-size:12px}
        .r-line{display:flex;justify-content:space-between;margin:2px 0}
        .r-line.total{font-weight:bold;border-top:1px dashed #000;margin-top:6px;padding-top:6px}
        .receipt-head{text-align:center}
        .r-thanks{text-align:center;margin-top:8px}
        hr{border:none;border-top:1px dashed #000;margin:6px 0}
      </style></head>
      <body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  });

  // ---------- Reports ----------
  function renderReports() {
    const sales = Store.getSales();
    const total = sales.reduce((s, x) => s + x.total, 0);
    const count = sales.length;
    const avg = count ? total / count : 0;
    document.getElementById('rep-total').textContent = 'RM ' + total.toFixed(2);
    document.getElementById('rep-count').textContent = count;
    document.getElementById('rep-avg').textContent = 'RM ' + avg.toFixed(2);

    const body = document.getElementById('report-body');
    if (!count) {
      body.innerHTML = '<tr><td colspan="6" class="empty">Tiada jualan lagi.</td></tr>';
      return;
    }
    body.innerHTML = sales.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${new Date(s.time).toLocaleString('ms-MY')}</td>
        <td>${s.items.map(it => `${escapeHtml(it.name)}×${it.qty}`).join(', ')}</td>
        <td>${s.total.toFixed(2)}</td>
        <td>${s.paid.toFixed(2)}</td>
        <td>${s.change.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  document.getElementById('btn-clear-sales').addEventListener('click', () => {
    if (confirm('Padam SEMUA rekod jualan? Tindakan ini tidak boleh diundur.')) {
      Store.clearSales();
      renderReports();
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Init ----------
  Store.seedIfEmpty();
  Catalog.refreshAll();
  Cart.render();
})();
