/* store.js - LocalStorage CRUD layer for products & sales */
(function (global) {
  'use strict';

  const KEYS = {
    products: 'pos.products',
    sales: 'pos.sales',
    seeded: 'pos.seeded'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Store read error', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const Store = {
    // ---------- Products ----------
    getProducts() {
      return read(KEYS.products, []);
    },
    getProduct(id) {
      return this.getProducts().find(p => p.id === id) || null;
    },
    saveProduct(data) {
      const products = this.getProducts();
      if (data.id) {
        const idx = products.findIndex(p => p.id === data.id);
        if (idx >= 0) {
          products[idx] = { ...products[idx], ...data };
        } else {
          products.push(data);
        }
      } else {
        data.id = uid();
        data.createdAt = Date.now();
        products.push(data);
      }
      write(KEYS.products, products);
      return data;
    },
    deleteProduct(id) {
      const products = this.getProducts().filter(p => p.id !== id);
      write(KEYS.products, products);
    },
    decreaseStock(id, qty) {
      const products = this.getProducts();
      const p = products.find(x => x.id === id);
      if (p) {
        p.stock = Math.max(0, p.stock - qty);
        write(KEYS.products, products);
      }
    },

    // ---------- Sales ----------
    getSales() {
      return read(KEYS.sales, []);
    },
    addSale(sale) {
      const sales = this.getSales();
      sale.id = uid();
      sale.time = Date.now();
      sales.unshift(sale);
      write(KEYS.sales, sales);
      return sale;
    },
    clearSales() {
      write(KEYS.sales, []);
    },

    // ---------- Seeding ----------
    isSeeded() {
      return read(KEYS.seeded, false);
    },
    markSeeded() {
      write(KEYS.seeded, true);
    },
    seedIfEmpty() {
      if (this.isSeeded()) return;
      const samples = [
        { name: 'Kopi O', barcode: '8001', category: 'Minuman', price: 2.00, stock: 50 },
        { name: 'Teh Tarik', barcode: '8002', category: 'Minuman', price: 2.50, stock: 40 },
        { name: 'Roti Canai', barcode: '8003', category: 'Makanan', price: 1.50, stock: 30 },
        { name: 'Nasi Lemak', barcode: '8004', category: 'Makanan', price: 6.50, stock: 20 },
        { name: 'Air Suam', barcode: '8005', category: 'Minuman', price: 1.00, stock: 100 },
        { name: 'Kuih Lapis', barcode: '8006', category: 'Makanan', price: 1.80, stock: 25 },
        { name: 'Milo Ais', barcode: '8007', category: 'Minuman', price: 3.50, stock: 35 },
        { name: 'Mee Goreng', barcode: '8008', category: 'Makanan', price: 7.00, stock: 15 },
        { name: 'Rokok (simulasi)', barcode: '9001', category: 'Lain-lain', price: 17.00, stock: 10 },
        { name: 'Tisu 1 box', barcode: '9002', category: 'Lain-lain', price: 5.90, stock: 12 }
      ];
      samples.forEach(s => this.saveProduct(s));
      this.markSeeded();
    },

    // ---------- Backup / Restore ----------
    exportData() {
      return JSON.stringify({
        products: this.getProducts(),
        sales: this.getSales()
      }, null, 2);
    },
    importData(jsonStr) {
      const data = JSON.parse(jsonStr);
      if (data.products) write(KEYS.products, data.products);
      if (data.sales) write(KEYS.sales, data.sales);
    }
  };

  global.Store = Store;
})(window);
