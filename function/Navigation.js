// ================================================
// utils.js — Fungsi & variabel yang dipakai bersama
// ================================================

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxvAkJM8wvA9zZWeRKIndgkWWb8eg5JvdeGofLWJW6TRovTr91RhHYjonq7njciTkj0YA/exec';

// ===== FORMAT RUPIAH =====
// Mengubah angka jadi format Rupiah.
// Contoh: fmt(8000) → "Rp 8.000"
function fmt(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

// ===== AUTH GUARD =====
// Dipanggil di awal setiap halaman buat ngecek apakah user
// sudah login dan punya akses ke halaman tersebut.
// Kalau belum login → redirect ke login.html
// Kalau role tidak punya akses → redirect ke halaman default role
const PAGE_ACCESS = {
  'index.html':       ['kasir'],
  'produk.html':      ['owner'],
  'riwayat.html':     ['kasir', 'owner'],
  'pengeluaran.html': ['kasir', 'owner'],
  'laporan.html':     ['owner'],
};

function authGuard() {
  const role = sessionStorage.getItem('pos_role');
  if (!role) {
    window.location.href = getLoginPath();
    return;
  }
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  const allowed = PAGE_ACCESS[file];
  if (allowed && !allowed.includes(role)) {
    const def = role === 'kasir' ? '../index.html' : 'produk.html';
    window.location.href = def;
  }
}

// Menentukan path login.html berdasarkan posisi file saat ini
// (apakah di dalam folder pages/ atau di root)
function getLoginPath() {
  const path = window.location.pathname;
  const inPages = path.includes('/pages/');
  return inPages ? 'login.html' : 'pages/login.html';
}

function logout() {
  sessionStorage.removeItem('pos_role');
  sessionStorage.removeItem('pos_user');
  window.location.href = getLoginPath();
}

function getRole() {
  return sessionStorage.getItem('pos_role') || '';
}

// ===== SYNC STOK KE SHEET =====
// Mengirim data stok terkini ke Google Sheets.
// Dipanggil setiap ada perubahan stok atau transaksi.
function syncStokKeSheet() {
  const produkList = JSON.parse(localStorage.getItem('produk_list') || '[]');
  const url = SHEET_URL
    + '?action=updateStok'
    + '&produk=' + encodeURIComponent(JSON.stringify(
        produkList.map(p => ({ nama: p.nama, stok: p.stok }))
      ));
  fetch(url, { mode: 'no-cors' }).catch(() => {});
}

// ===== SYNC DATA PRODUK LENGKAP KE SHEET =====
// Mengirim seluruh data produk (nama, harga, emoji, kategori, stok) ke Sheets.
// Dipanggil setiap kali ada tambah/edit/hapus produk di produk.html,
// supaya Google Sheets jadi sumber data yang sama di semua perangkat.
function syncProdukKeSheet() {
  const produkList = JSON.parse(localStorage.getItem('produk_list') || '[]');
  const url = SHEET_URL
    + '?action=simpanProduk'
    + '&produk=' + encodeURIComponent(JSON.stringify(produkList));
  fetch(url, { mode: 'no-cors' }).catch(() => {});
}

// ===== LOAD PRODUK DARI SHEET =====
// Mengambil data produk dari Google Sheets saat halaman dibuka.
// Kalau berhasil → simpan ke localStorage & jalankan callback(true).
// Kalau gagal (offline/error) → pakai localStorage yang ada & callback(false).
//
// Cara pakai di produk.html / index.html:
//   loadProdukDariSheet(() => {
//     produkList = JSON.parse(localStorage.getItem('produk_list') || '[]');
//     renderProduk();
//   });
function loadProdukDariSheet(callback) {
  const url = SHEET_URL + '?action=getProduk';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok' && Array.isArray(data.produk) && data.produk.length > 0) {
        localStorage.setItem('produk_list', JSON.stringify(data.produk));
      }
      callback(true);
    })
    .catch(() => {
      // Gagal fetch (offline dll) → pakai data localStorage yang sudah ada
      callback(false);
    });
}

// ===== LOAD PENGELUARAN DARI SHEET =====
// Mengambil data pengeluaran dari Google Sheets saat halaman dibuka.
// Kalau berhasil → simpan ke localStorage & jalankan callback(true).
// Kalau gagal (offline/error) → pakai localStorage yang ada & callback(false).
function loadPengeluaranDariSheet(callback) {
  const url = SHEET_URL + '?action=getPengeluaran';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok' && Array.isArray(data.pengeluaran) && data.pengeluaran.length > 0) {
        localStorage.setItem('pengeluaran', JSON.stringify(data.pengeluaran));
      }
      callback(true);
    })
    .catch(() => {
      // Gagal fetch (offline dll) → pakai data localStorage yang sudah ada
      callback(false);
    });
}

// ===== HITUNG PEMASUKAN HARI INI =====
// Menghitung total pemasukan dari transaksi yang statusnya 'tersimpan'
// (sudah dibayar). Disimpan di localStorage dengan key 'pemasukan_harian'.
// Data pemasukan di-reset otomatis setiap hari baru.
//
// Struktur data pemasukan_harian di localStorage:
// { tanggal: '10/06/2026', total: 150000 }
//
// Dipanggil di riwayat.html untuk nampilin total pemasukan hari ini.
function hitungPemasukanHariIni() {
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Cek apakah data pemasukan masih untuk hari ini
  // Kalau tanggalnya beda (hari baru), reset ke 0
  const saved = JSON.parse(localStorage.getItem('pemasukan_harian') || '{}');
  if (saved.tanggal !== today) {
    // Hari baru → hitung ulang dari data riwayat yang ada
    const riwayat = JSON.parse(localStorage.getItem('riwayat') || '[]');
    const total = riwayat
      .filter(r => r.status === 'tersimpan' && r.tanggal.startsWith(today))
      .reduce((s, r) => s + r.total, 0);

    const baru = { tanggal: today, total };
    localStorage.setItem('pemasukan_harian', JSON.stringify(baru));
    return total;
  }

  return saved.total || 0;
}

// Menambah jumlah pemasukan harian ketika ada transaksi baru yang dibayar.
// Dipanggil dari riwayat.html saat user klik tombol "Bayar".
function tambahPemasukan(jumlah) {
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const saved = JSON.parse(localStorage.getItem('pemasukan_harian') || '{}');

  // Kalau tanggal sama, tambah ke total yang ada
  // Kalau hari baru, mulai dari jumlah ini
  const totalBaru = (saved.tanggal === today ? (saved.total || 0) : 0) + jumlah;
  localStorage.setItem('pemasukan_harian', JSON.stringify({ tanggal: today, total: totalBaru }));
}

// ===== AUTO RESET RIWAYAT 2 HARI =====
// Mengecek apakah riwayat perlu di-reset otomatis.
// Riwayat akan dihapus otomatis setelah 2 hari sejak transaksi pertama.
// Tanggal mulai disimpan di localStorage key 'riwayat_mulai'.
//
// Dipanggil saat halaman riwayat dibuka.
function cekAutoResetRiwayat() {
  const riwayat = JSON.parse(localStorage.getItem('riwayat') || '[]');
  if (riwayat.length === 0) return; // tidak ada data, skip

  const today = new Date();
  const mulaiStr = localStorage.getItem('riwayat_mulai');

  if (!mulaiStr) {
    // Belum ada tanggal mulai → set sekarang
    localStorage.setItem('riwayat_mulai', today.toISOString());
    return;
  }

  const mulai = new Date(mulaiStr);
  const selisihHari = Math.floor((today - mulai) / (1000 * 60 * 60 * 24));

  // Kalau sudah 2 hari atau lebih → reset riwayat
  if (selisihHari >= 2) {
    localStorage.removeItem('riwayat');
    localStorage.removeItem('riwayat_mulai');
    localStorage.removeItem('nomorTransaksi');     // key lama, jaga-jaga masih ada
    localStorage.removeItem('nomorTransaksiData');  // key baru (reset harian per nomor transaksi)
    localStorage.removeItem('pemasukan_harian');
    console.log('Riwayat auto-reset setelah 2 hari.');
  }
}
