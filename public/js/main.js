document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFaqAccordion();
  initAshParticles();
  initAdminModal();
  initAdminLogin();
  initAdminForm();
  initImageUpload();
  initShopFilters();
  initKickLogout();

  document.getElementById('searchInput').addEventListener('input', e => renderLeaderboard(e.target.value));

  document.getElementById('kickLoginBtn').addEventListener('click', () => {
    window.location.href = '/api/auth/kick/login';
  });

  initKickAuthStatus();
  renderLeaderboard();
  renderYourStats();
  renderShop();
  renderInventory();
});
