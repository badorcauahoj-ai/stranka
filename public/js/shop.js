let shopFilter = 'all';
let shopItemsCache = [];

async function renderShop() {
  const grid = document.getElementById('shopGrid');
  shopItemsCache = await API.getShopItems();
  const filtered = shopItemsCache.filter(i => shopFilter === 'all' || i.type === shopFilter);
  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><strong>Zatím žádné výhry</strong>Databáze ještě není napojená — výhry se objeví, jakmile je admin přidá.</div>`;
    return;
  }
  filtered.forEach(i => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = i.id;
    card.innerHTML = `
      <div class="item-thumb">${thumbHtml(i.img)}</div>
      <div class="item-name">${i.name}</div>
      <div class="item-rarity">${i.type}${i.type === 'Losování' ? ' · lze koupit vícekrát' : ''}</div>
      <div class="item-row">
        <div class="item-price">${i.price.toLocaleString('cs-CZ')} KK</div>
        <button class="item-buy" data-buy="${i.id}">Koupit</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      buyItem(+btn.dataset.buy);
    });
  });

  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = shopItemsCache.find(x => x.id === +card.dataset.itemId);
      if (item) openItemModal(item);
    });
  });
}

function openItemModal(item) {
  document.getElementById('itemModalThumb').innerHTML = thumbHtml(item.img);
  document.getElementById('itemModalType').textContent =
    item.type + (item.type === 'Losování' ? ' · lze koupit vícekrát' : '');
  document.getElementById('itemModalName').textContent = item.name;
  document.getElementById('itemModalDesc').textContent =
    item.description && item.description.trim() ? item.description : 'Bez popisu.';
  document.getElementById('itemModalPrice').textContent =
    item.price.toLocaleString('cs-CZ') + ' KK';

  document.getElementById('itemModalBuy').onclick = () => buyItem(item.id);
  document.getElementById('itemModalOverlay').classList.add('open');
}

function closeItemModal() {
  document.getElementById('itemModalOverlay').classList.remove('open');
}

function initItemModal() {
  document.getElementById('itemModalClose').addEventListener('click', closeItemModal);
  document.getElementById('itemModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'itemModalOverlay') closeItemModal();
  });
}

async function buyItem(id) {
  const result = await API.buyItem(id, 1);
  if (!result.ok) {
    showToast(result.error || 'Nákup se nezdařil. Zkontroluj, že jsi přihlášený a máš dost KK.', 'error');
    return;
  }
  closeItemModal();
  showToast('Nákup proběhl úspěšně!');
  renderShop();
  renderYourStats();
}

function initShopFilters() {
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      shopFilter = p.dataset.filter;
      renderShop();
    });
  });
}
