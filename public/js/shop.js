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
    btn.addEventListener('click', () => buyItem(+btn.dataset.buy));
  });
}

async function buyItem(id) {
  const result = await API.buyItem(id, 1);

  if (!result.ok) {
    if (result.status === 401) {
      kkAlert('Pro nákup se musíš nejdřív přihlásit přes Kick.', {
        title: 'Nejsi přihlášený',
        type: 'error'
      });
    } else {
      kkAlert(result.error || 'Zkontroluj, že máš dost KK bodů.', {
        title: 'Nákup se nezdařil',
        type: 'error'
      });
    }
    return;
  }

  kkAlert('Výhra je teď v tvém inventáři.', {
    title: 'Nákup proběhl úspěšně',
    type: 'success'
  });
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
