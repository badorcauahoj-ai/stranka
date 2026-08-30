document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFaqAccordion();
  initAshParticles();
  initAdminModal();
  initAdminLogin();
  initAdminForm();
  initImageUpload();
  initShopFilters();

  document.getElementById('searchInput').addEventListener('input', e => renderLeaderboard(e.target.value));

  document.getElementById('kickLoginBtn').addEventListener('click', () => {
    window.location.href = '/api/auth/kick/login';
  });

  renderLeaderboard();
  renderYourStats();
  renderShop();
  renderInventory();
});
