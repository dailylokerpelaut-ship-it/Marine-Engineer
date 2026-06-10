# Daily Loker Pelaut — Midtrans MVP Merchant-Ready Files

File ini dibuat untuk membantu approval merchant Midtrans tanpa membangun e-commerce besar.

## File utama

1. `index-merchant-ready.html`
   - Landing page existing yang sudah ditambahkan section merchant-ready.
   - CTA utama diarahkan ke checkout internal.
   - Marketplace tetap ada sebagai channel tambahan, bukan jalur checkout utama.

2. `checkout.html`
   - Checkout dua kolom seperti halaman checkout e-commerce modern.
   - Kiri: kontak, pengantaran, metode pengiriman, pembayaran.
   - Kanan: ringkasan order, subtotal, pengiriman, total, tombol bayar.
   - Siap dihubungkan ke Midtrans Snap via backend/Apps Script.

3. `payment-success.html`
4. `payment-pending.html`
5. `payment-failed.html`
   - Halaman redirect setelah proses pembayaran.

6. `apps-script-midtrans-backend.gs`
   - Backend ringan untuk Google Apps Script.
   - Menyimpan order ke Google Sheets.
   - Membuat Snap Token Midtrans.
   - Menerima notification webhook dari Midtrans.

## Produk dan harga saat ini

- Interview Mastery untuk Pelaut: Rp179.000
- Interview Mastery untuk Marine Engineer: Rp279.000
- AI Interview Simulator: Rp49.000

## Link detail produk Pelaut

Detail dan FAQ Interview Mastery untuk Pelaut diarahkan ke:

`https://pelaut.dailylokerpelaut.com/`

## Kebijakan pengiriman buku

- Order yang pembayaran/check-out selesai sebelum pukul 17.00 WIB diproses untuk pengiriman di hari yang sama.
- Order setelah pukul 17.00 WIB diproses dan dikirim pada keesokan harinya.
- Pembeli wajib mengisi alamat lengkap dan nomor WhatsApp aktif.

## Setup Midtrans

### 1. Edit `checkout.html`

Ganti:

```html
<script src="https://app.midtrans.com/snap/snap.js" data-client-key="PASTE_MIDTRANS_CLIENT_KEY_HERE"></script>
```

Dengan Client Key Midtrans kamu.

Untuk Sandbox, gunakan:

```html
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="CLIENT_KEY_SANDBOX"></script>
```

Untuk Production, gunakan:

```html
<script src="https://app.midtrans.com/snap/snap.js" data-client-key="CLIENT_KEY_PRODUCTION"></script>
```

### 2. Isi endpoint backend

Di `checkout.html`, cari:

```js
CREATE_ORDER_ENDPOINT: ""
```

Isi dengan URL Web App Google Apps Script kamu.

Contoh:

```js
CREATE_ORDER_ENDPOINT: "https://script.google.com/macros/s/xxxx/exec"
```

### 3. Setup Google Sheet

Buat Google Sheet baru dengan nama bebas, misalnya:

`DLP Orders Midtrans`

Sheet tab boleh kosong. Script akan membuat header otomatis.

### 4. Setup Apps Script

1. Buka Google Sheet.
2. Extensions > Apps Script.
3. Paste isi `apps-script-midtrans-backend.gs`.
4. Project Settings > Script Properties.
5. Tambahkan:

```text
MIDTRANS_SERVER_KEY = Server Key dari Midtrans
MIDTRANS_ENV = sandbox
SHEET_ID = ID Google Sheet kamu
```

Untuk production nanti ubah:

```text
MIDTRANS_ENV = production
```

### 5. Deploy Web App

1. Apps Script > Deploy > New deployment.
2. Type: Web app.
3. Execute as: Me.
4. Who has access: Anyone.
5. Copy URL Web App.
6. Paste ke `CREATE_ORDER_ENDPOINT` di `checkout.html`.

## Screenshot checklist untuk Midtrans

Ambil screenshot berikut untuk dokumen PDF flow transaksi:

1. Landing page produk Marine Engineer.
2. Section Produk Resmi.
3. Harga Rp279.000 untuk Marine Engineer.
4. Harga Rp179.000 untuk Interview Mastery untuk Pelaut.
5. Nama produk digital: AI Interview Simulator.
6. Tombol Checkout Resmi via Midtrans.
7. Halaman checkout dua kolom.
8. Form kontak.
9. Form pengantaran.
10. Metode pengiriman.
11. Section pembayaran Midtrans.
12. Ringkasan order.
13. Tombol Bayar Sekarang.
14. Halaman Midtrans Snap.
15. Pilihan metode pembayaran Midtrans.
16. Payment success/pending/error.
17. Thank you page di domain sendiri.
18. Bukti order masuk ke Google Sheets.

## Catatan approval

Untuk menjaga approval Midtrans:

- CTA utama jangan diarahkan ke Shopee, Lynk.id, Google Form, atau marketplace.
- Marketplace boleh ada sebagai channel tambahan/trust, bukan flow utama.
- Checkout utama harus dari domain Daily Loker Pelaut.
- Redirect ke Midtrans diperbolehkan karena itu bagian dari proses pembayaran.
- Setelah payment, user diarahkan kembali ke halaman success/pending/failed di domain sendiri.
- Pastikan rekening sesuai entitas pendaftaran Midtrans.
