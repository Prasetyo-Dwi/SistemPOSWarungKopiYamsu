// ================================================
// utils.js — Fungsi & variabel yang dipakai bersama
// ================================================

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxvAkJM8wvA9zZWeRKIndgkWWb8eg5JvdeGofLWJW6TRovTr91RhHYjonq7njciTkj0YA/exec';

// ===== FORMAT RUPIAH =====
function fmt(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

// ===== AUTH GUARD =====
// Panggil di awal setiap halaman: authGuard(['kasir','owner'])
// atau authGuard(['owner']) kalau hanya owner yang boleh
const PAGE_ACCESS = {
  'index.html':       ['kasir'],
  'produk.html':      ['owner'],
  'riwayat.html':     ['kasir', 'owner'],
  'pengeluaran.html': ['kasir', 'owner'],
};

function authGuard() {
  const role = sessionStorage.getItem('pos_role');
  if (!role) {
    window.location.href = getLoginPath();
    return;
  }
  // Cek akses halaman ini
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  const allowed = PAGE_ACCESS[file];
  if (allowed && !allowed.includes(role)) {
    // Redirect ke halaman default role
    const def = role === 'kasir' ? '../index.html' : 'pages/produk.html';
    window.location.href = def;
  }
}

function getLoginPath() {
  const path = window.location.pathname;
  const inPages = path.includes('/pages/');
  return 'pages/login.html';
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
// Mengirim data stok terkini dari localStorage ke Google Sheets.
// Sheet Stok baris 2 akan terupdate otomatis.
// Dipanggil setiap kali:
// - Kasir klik Simpan transaksi (index.html)
// - Pemilik tambah/edit/hapus/ubah stok produk (produk.html)
function syncStokKeSheet() {
  const produkList = JSON.parse(localStorage.getItem('produk_list') || '[]');
  const url = SHEET_URL
    + '?action=updateStok'
    + '&produk=' + encodeURIComponent(JSON.stringify(
        produkList.map(p => ({ nama: p.nama, stok: p.stok }))
      ));
  fetch(url, { mode: 'no-cors' }).catch(() => {});
}