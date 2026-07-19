/* cart.js - Cart management, checkout, receipt */
(function (global) {
  'use strict';

  let cart = []; // [{id, name, price, qty}]

  const Cart = {
    get() { return cart; },

    add(productId) {
      const p = Store.getProduct(productId);
      if (!p) return;
      if (p.stock <= 0) {
        alert('Stok habis!');
        return;
      }
      const line = cart.find(i => i.id === productId);
      if (line) {
        if (line.qty >= p.stock) {
          alert('Mencapai stok maksimum.');
          return;
        }
        line.qty++;
      } else {
        cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
      }
      this.render();
    },

    remove(productId) {
      cart = cart.filter(i => i.id !== productId);
      this.render();
    },

    changeQty(productId, delta) {
      const line = cart.find(i => i.id === productId);
      if (!line) return;
      const p = Store.getProduct(productId);
      const newQty = line.qty + delta;
      if (newQty <= 0) {
        this.remove(productId);
        return;
      }
      if (p && newQty > p.stock) {
        alert('Mencapai stok maksimum.');
        return;
      }
      line.qty = newQty;
      this.render();
    },

    clear() {
      cart = [];
      this.render();
    },

    subtotal() {
      return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    },

    total() {
      const disc = parseFloat(document.getElementById('cart-discount').value) || 0;
      return Math.max(0, this.subtotal() - disc);
    },

    render() {
      const wrap = document.getElementById('cart-items');
      if (!cart.length) {
        wrap.innerHTML = '<p class="empty">Troli kosong. Klik produk untuk tambah.</p>';
      } else {
        wrap.innerHTML = cart.map(i => `
          <div class="cart-line">
            <div class="cl-name">${escapeHtml(i.name)}</div>
            <div class="cl-controls">
              <button data-act="dec" data-id="${i.id}">-</button>
              <span>${i.qty}</span>
              <button data-act="inc" data-id="${i.id}">+</button>
              <span class="cl-price">RM ${(i.price * i.qty).toFixed(2)}</span>
              <button data-act="del" data-id="${i.id}" class="cl-remove">×</button>
            </div>
          </div>
        `).join('');
      }
      this.updateTotals();
    },

    updateTotals() {
      const count = cart.reduce((s, i) => s + i.qty, 0);
      const sub = this.subtotal();
      const total = this.total();
      const paid = parseFloat(document.getElementById('cart-paid').value) || 0;
      const change = paid - total;

      document.getElementById('cart-count').textContent = count;
      document.getElementById('cart-subtotal').textContent = 'RM ' + sub.toFixed(2);
      document.getElementById('cart-total').textContent = 'RM ' + total.toFixed(2);
      document.getElementById('cart-change').textContent = 'RM ' + (change >= 0 ? change.toFixed(2) : '0.00');
      document.getElementById('cart-badge').textContent = count;

      const btn = document.getElementById('btn-checkout');
      btn.disabled = cart.length === 0 || total <= 0 || paid < total;
    },

    // Quick pay buttons: set exact or add RM amount
    setPaid(value) {
      const input = document.getElementById('cart-paid');
      const total = this.total();
      if (value === 'exact') {
        input.value = total.toFixed(2);
      } else {
        const current = parseFloat(input.value) || 0;
        // if current matches a button value, start fresh; otherwise add
        input.value = (current + value).toFixed(2);
      }
      this.updateTotals();
    },

    checkout() {
      const total = this.total();
      const paid = parseFloat(document.getElementById('cart-paid').value) || 0;
      if (paid < total) {
        alert('Jumlah bayar kurang dari total.');
        return;
      }
      // decrease stock
      cart.forEach(i => Store.decreaseStock(i.id, i.qty));
      // save sale
      const sale = {
        items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
        subtotal: this.subtotal(),
        discount: parseFloat(document.getElementById('cart-discount').value) || 0,
        total,
        paid,
        change: paid - total
      };
      Store.addSale(sale);
      // show receipt
      this.showReceipt(sale);
      // reset
      this.clear();
      document.getElementById('cart-discount').value = 0;
      document.getElementById('cart-paid').value = 0;
      Catalog.refreshAll();
    },

    showReceipt(sale) {
      const now = new Date();
      const dateStr = now.toLocaleString('ms-MY');
      const itemsHtml = sale.items.map(i =>
        `<div class="r-line">
          <span>${escapeHtml(i.name)} ×${i.qty}</span>
          <span>RM ${(i.price * i.qty).toFixed(2)}</span>
        </div>`
      ).join('');

      document.getElementById('receipt-content').innerHTML = `
        <div class="receipt-head">
          <h3>🧾 AFQAmeer POS</h3>
          <p>${dateStr}</p>
        </div>
        <hr/>
        ${itemsHtml}
        <hr/>
        <div class="r-line"><span>Subtotal</span><span>RM ${sale.subtotal.toFixed(2)}</span></div>
        <div class="r-line"><span>Diskaun</span><span>-RM ${sale.discount.toFixed(2)}</span></div>
        <div class="r-line total"><span>TOTAL</span><span>RM ${sale.total.toFixed(2)}</span></div>
        <div class="r-line"><span>Bayar</span><span>RM ${sale.paid.toFixed(2)}</span></div>
        <div class="r-line"><span>Baki</span><span>RM ${sale.change.toFixed(2)}</span></div>
        <hr/>
        <p class="r-thanks">Terima kasih!</p>
      `;
      document.getElementById('receipt-modal').classList.remove('hidden');
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  global.Cart = Cart;
})(window);
