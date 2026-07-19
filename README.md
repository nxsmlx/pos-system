# AFQAmeer POS (Vanilla JS - GitHub Pages)

Sistem POS (Point of Sale) ringan dibina dengan **HTML/CSS/JS tulen** - tiada build step, tiada backend. Data disimpan dalam **LocalStorage** browser. Sesuai dihos di **GitHub Pages**.

## Features

- **Tab Jualan (POS)** - grid produk, klik untuk tambah ke trol, kira total + baki
- **Tab Produk (Catalog)** - CRUD produk (tambah / edit / padam), search & filter
- **Tab Laporan** - ringkasan jualan (jumlah, bil. transaksi, purata) + senarai transaksi
- **Diskaun** - input diskkaun RM pada cart
- **Resit** - paparan + cetak (window.print)
- **Stok** - auto tolak stok selepas checkout, amaran bila stok rendah (≤5)
- **Sample data** - 10 produk contoh dimuatkan pada first load
- **Responsive** - works pada desktop & tablet

## Struktur Project

```
pos-system/
├── index.html          # UI utama (3 tab)
├── css/style.css       # Styling
├── js/
│   ├── store.js        # LocalStorage CRUD (produk + sales + seed)
│   ├── catalog.js      # Grid produk + table catalog + CRUD modal
│   ├── cart.js         # Cart + checkout + resit
│   └── app.js          # Init, tab routing, event wiring, laporan
└── README.md
```

## Cara Guna (Lokal)

Tiada server diperlukan. Boleh buka terus `index.html` dalam browser, atau guna server statik:

```powershell
# Python
python -m http.server 8000

# atau Node
npx serve
```

Buka: `http://localhost:8000`

## Deploy ke GitHub Pages

### Langkah 1: Buat repo di GitHub
Buat repo baru, cth: `pos-system` (public).

### Langkah 2: Init & push
```powershell
cd C:\Users\Admin\pos-system
git init
git add .
git commit -m "Initial POS system"
git branch -M main
git remote add origin https://github.com/<USERNAME>/pos-system.git
git push -u origin main
```

### Langkah 3: Enable GitHub Pages
1. Pergi ke repo -> **Settings** -> **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` / folder: `/ (root)`
4. **Save**

Selepas ~1 minit, site akan tersedia di:
```
https://<USERNAME>.github.io/pos-system/
```

## Backup & Restore (Export / Import)

Buka DevTools console:
```js
// Export ke JSON string (copy & simpan ke file)
copy(JSON.parse(JSON.stringify(Store.exportData())));  // atau:
console.log(Store.exportData());

// Import dari JSON string
Store.importData(`{...paste JSON di sini...}`);
```

## Had (Known Limitations)

- Data terikat pada **browser + device** tertentu (LocalStorage tidak sync antara peranti)
- Tidak ada login / multi-user
- Tidak ada cloud backup (manual export JSON)
- Jika clear browser data, semua data hilang - kerap buat backup

## Langkah Seterusnya (cadangan)

- [ ] Barcode scanner input (focus ke search box)
- [ ] Kategori produk dengan filter dropdown
- [ ] Export laporan ke CSV
- [ ] Modal penuh POS (landscape full-screen)
- [ ] PWA (offline install)
