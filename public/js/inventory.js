async function renderInventory() {
  const grid = document.getElementById('invGrid');
  const me = await API.getMe();

  if (!me) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><strong>Nejsi přihlášený</strong>Přihlas se přes Kick, ať vidíš svoje nákupy.</div>`;
    return;
  }

  const inventory = await API.getInventory();
  if (inventory.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><strong>Inventář je prázdný</strong>Zatím sis nic nekoupil/a v Shopu.</div>`;
    return;
  }

  grid.innerHTML = '';
  inventory.forEach(i => {
    const card = document.createElement('div');
    card.className = 'inv-card';
    card.innerHTML = `
      <div class="item-thumb">${thumbHtml(i.img)}</div>
      <div class="item-name">${i.name}${i.quantity > 1 ? ' ×' + i.quantity : ''}</div>
    `;
    grid.appendChild(card);
  });
}
