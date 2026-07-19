/* app.js - Init, bottom nav, dashboard, chips, quick-pay, reports, CSV export */
(function () {
  'use strict';

  // ---------- Tab switching ----------
  function switchTab(target) {
    document.querySelectorAll('.bn-item').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === target)
    );
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + target)
    );
    if (target === 'dashboard') renderDashboard();
    if (target === 'catalog') Catalog.refreshAll();
    if (target === 'pos') Catalog.refreshAll();
    if (target === 'reports') renderReports();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.bn-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Quick actions on dashboard
  document.querySelectorAll('.qa-btn[data-go]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.go === 'catalog' ? 'catalog' : btn.dataset.go));
  });

  // ---------- Header clock ----------
  function tickClock() {
    const el = document.getElementById('header-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
  }
  setInterval(tickClock, 1000); tickClock();

  // ---------- POS search ----------
  document.getElementById('pos-search').addEventListener('input', (e) => {
    Catalog.renderPosGrid(Catalog.applyFilter(e.target.value));
  });

  // ---------- POS grid click -> add to cart ----------
  document.getElementById('pos-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card || card.disabled) return;
    Cart.add(card.dataset.id);
  });

  // ---------- Chips (kategori) ----------
  document.getElementById('pos-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    Catalog.activeCategory = chip.dataset.cat;
    Catalog.renderChips('pos-chips');
    Catalog.renderPosGrid(Catalog.applyFilter(document.getElementById('pos-search').value));
  });
  document.getElementById('catalog-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    Catalog.activeCategory = chip.dataset.cat;
    Catalog.renderChips('catalog-chips');
    Catalog.renderCatalogGrid(Catalog.applyFilter(document.getElementById('catalog-search').value));
  });

  // ---------- Cart controls ----------
  document.getElementById('cart-items').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id, act = btn.dataset.act;
    if (act === 'inc') Cart.changeQty(id, +1);
    if (act === 'dec') Cart.changeQty(id, -1);
    if (act === 'del') Cart.remove(id);
  });

  ['cart-discount', 'cart-paid'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => Cart.updateTotals());
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('Kosongkan troli?')) Cart.clear();
  });
  document.getElementById('btn-checkout').addEventListener('click', () => Cart.checkout());

  // ---------- Troli toggle (mobile collapsible) ----------
  const cartPanel = document.getElementById('cart-panel');
  const cartToggle = document.getElementById('cart-toggle');
  // Default: collapsed on mobile
  if (window.innerWidth < 768) cartPanel.classList.add('collapsed');
  cartToggle.addEventListener('click', () => {
    cartPanel.classList.toggle('collapsed');
  });

  // ---------- Quick pay buttons ----------
  document.getElementById('quick-pay').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pay]');
    if (!btn) return;
    const v = btn.dataset.pay;
    if (v === 'exact') Cart.setPaid('exact');
    else Cart.setPaid(parseFloat(v));
  });

  // ---------- Catalog ----------
  document.getElementById('catalog-search').addEventListener('input', (e) => {
    Catalog.renderCatalogGrid(Catalog.applyFilter(e.target.value));
  });
  document.getElementById('btn-add-product').addEventListener('click', () => Catalog.openModal(null));
  document.getElementById('catalog-grid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.cat-actions .edit');
    const delBtn = e.target.closest('.cat-actions .del');
    if (editBtn) Catalog.openModal(Store.getProduct(editBtn.dataset.id));
    if (delBtn && confirm('Padam produk ini?')) {
      Store.deleteProduct(delBtn.dataset.id);
      Catalog.refreshAll();
    }
  });
  document.getElementById('product-form').addEventListener('submit', (e) => Catalog.handleSubmit(e));
  document.getElementById('btn-cancel').addEventListener('click', () => Catalog.closeModal());

  // ---------- Receipt ----------
  document.getElementById('btn-receipt-close').addEventListener('click', () =>
    document.getElementById('receipt-modal').classList.add('hidden')
  );
  document.getElementById('btn-print').addEventListener('click', () => {
    const html = document.getElementById('receipt-content').innerHTML;
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(`
      <html><head><title>Resit - AFQAmeer POS</title>
      <style>
        body{font-family:monospace;padding:14px;font-size:12px;color:#000}
        .r-line{display:flex;justify-content:space-between;margin:3px 0}
        .r-line.total{font-weight:bold;border-top:1px dashed #000;margin-top:8px;padding-top:6px}
        .receipt-head{text-align:center;margin-bottom:10px}
        .r-thanks{text-align:center;margin-top:10px;font-weight:bold}
        hr{border:none;border-top:1px dashed #000;margin:8px 0}
      </style></head>
      <body>${html}</body></html>`);
    w.document.close(); w.focus(); w.print();
  });

  // ---------- Export backup ----------
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = Store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afqameer-pos-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Dashboard ----------
  function renderDashboard() {
    const sales = Store.getSales();
    const products = Store.getProducts();
    const todayStr = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.time).toDateString() === todayStr);
    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
    const totalAll = sales.reduce((s, x) => s + x.total, 0);
    const lowStock = products.filter(p => p.stock <= 5).length;

    document.getElementById('dash-date').textContent = new Date().toLocaleDateString('ms-MY', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    document.getElementById('dash-today').textContent = 'RM ' + todayTotal.toFixed(2);
    document.getElementById('dash-today-count').textContent = todaySales.length + ' transaksi';
    document.getElementById('dash-total').textContent = 'RM ' + totalAll.toFixed(2);
    document.getElementById('dash-count').textContent = sales.length;
    document.getElementById('dash-products').textContent = products.length;
    document.getElementById('dash-low').textContent = lowStock;

    // Recent 5 sales today
    const list = document.getElementById('dash-recent');
    if (!todaySales.length) {
      list.innerHTML = '<p class="empty">Tiada jualan lagi hari ini.</p>';
    } else {
      list.innerHTML = todaySales.slice(0, 5).map(s => `
        <div class="recent-item">
          <div class="ri-info">
            <span class="ri-time">${new Date(s.time).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
            <span class="ri-items">${s.items.length} item · ${s.items.map(i => escapeHtml(i.name)).slice(0,2).join(', ')}${s.items.length > 2 ? '...' : ''}</span>
          </div>
          <span class="ri-amount">RM ${s.total.toFixed(2)}</span>
        </div>
      `).join('');
    }
  }

  // ---------- Reports ----------
  function renderReports() {
    const sales = Store.getSales();
    const total = sales.reduce((s, x) => s + x.total, 0);
    const count = sales.length;
    const avg = count ? total / count : 0;
    document.getElementById('rep-total').textContent = 'RM ' + total.toFixed(2);
    document.getElementById('rep-count').textContent = count;
    document.getElementById('rep-avg').textContent = 'RM ' + avg.toFixed(2);

    const list = document.getElementById('report-list');
    if (!count) {
      list.innerHTML = '<p class="empty">Tiada jualan lagi.</p>';
      return;
    }
    list.innerHTML = sales.map((s, i) => `
      <div class="report-row">
        <div class="rr-left">
          <span class="rr-no">#${i + 1}</span>
          <span class="rr-time">${new Date(s.time).toLocaleString('ms-MY')}</span>
          <span class="rr-items">${s.items.map(it => `${escapeHtml(it.name)}×${it.qty}`).join(', ')}</span>
        </div>
        <div class="rr-right">
          <span class="rr-amount">RM ${s.total.toFixed(2)}</span>
          <div class="rr-change">Bayar RM ${s.paid.toFixed(2)} · Baki RM ${s.change.toFixed(2)}</div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('btn-clear-sales').addEventListener('click', () => {
    if (confirm('Padam SEMUA rekod jualan? Tindakan ini tidak boleh diundur.')) {
      Store.clearSales(); renderReports();
    }
  });

  // ---------- CSV export ----------
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    const sales = Store.getSales();
    if (!sales.length) { alert('Tiada jualan untuk export.'); return; }
    const rows = [['No', 'Masa', 'Item', 'Subtotal', 'Diskaun', 'Total', 'Bayar', 'Baki']];
    sales.forEach((s, i) => {
      rows.push([
        i + 1,
        new Date(s.time).toLocaleString('ms-MY'),
        '"' + s.items.map(it => `${it.name}x${it.qty}`).join(', ') + '"',
        s.subtotal.toFixed(2),
        s.discount.toFixed(2),
        s.total.toFixed(2),
        s.paid.toFixed(2),
        s.change.toFixed(2)
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laporan-jualan-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Init ----------
  Store.seedIfEmpty();
  Catalog.refreshAll();
  Cart.render();
  renderDashboard();

  // ---------- Service Worker (PWA: offline + fullscreen app) ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW failed:', err));
    });
  }
})();
