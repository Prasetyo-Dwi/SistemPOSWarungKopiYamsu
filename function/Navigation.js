// ================================================
// Navigation.js — Bottom nav sesuai role
// ================================================
const NAV_CONFIG = {
  kasir: [
    { label: 'Transaksi',   file: 'index.html' },
    { label: 'Riwayat',     file: 'pages/riwayat.html' },
    { label: 'Pengeluaran', file: 'pages/pengeluaran.html' },
  ],
  owner: [
    { label: 'Produk',      file: 'pages/produk.html' },
    { label: 'Riwayat',     file: 'pages/riwayat.html' },
    { label: 'Pengeluaran', file: 'pages/pengeluaran.html' },
  ],
};

function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('riwayat'))     return 'pages/riwayat.html';
  if (path.includes('produk'))      return 'pages/produk.html';
  if (path.includes('pengeluaran')) return 'pages/pengeluaran.html';
  return 'index.html';
}

function buildNav() {
  const role = sessionStorage.getItem('pos_role') || 'kasir';
  const items = NAV_CONFIG[role] || NAV_CONFIG.kasir;
  const curPage = getCurrentPage();

  const navEls = document.querySelectorAll('.footer-nav, .bottomnav');
  navEls.forEach(nav => {
    nav.innerHTML = items.map(item => {
      const isActive = item.file === curPage;
      return `<div class="nav-item ${isActive ? 'active' : ''}" data-file="${item.file}">
        <p>${item.label}</p>
      </div>`;
    }).join('');

    nav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        navigateTo(el.dataset.file);
      });
    });
  });
}

function navigateTo(targetFile) {
  const curFile = getCurrentPage();
  if (targetFile === curFile) return;

  const allFiles = ['index.html', 'pages/produk.html', 'pages/riwayat.html', 'pages/pengeluaran.html'];
  const curIdx = allFiles.indexOf(curFile);
  const tgtIdx = allFiles.indexOf(targetFile);
  const direction = tgtIdx > curIdx ? 1 : -1;

  document.body.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  document.body.style.transform = `translateX(${direction * -100}%)`;
  document.body.style.opacity = '0';

 setTimeout(() => {
    const inPages = window.location.pathname.includes('/pages/');
    let href = targetFile;
    if (inPages && targetFile.startsWith('pages/')) {
      href = targetFile.replace('pages/', '');
    } else if (inPages && !targetFile.startsWith('pages/')) {
      href = '../' + targetFile;
    }
    window.location.href = href;
  }, 280);
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.style.transform = 'translateX(0)';
  document.body.style.opacity = '1';
  buildNav();
});