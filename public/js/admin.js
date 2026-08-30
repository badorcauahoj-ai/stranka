let editingId = null;

async function renderAdminList() {
  const wrap = document.getElementById('adminList');
  const items = await API.getShopItems();
  wrap.innerHTML = '';

  if (items.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><strong>Žádné výhry</strong>Přidej první výhru výše.</div>`;
    return;
  }

  items.forEach(i => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div class="a-thumb">${thumbHtml(i.img)}</div>
      <div><div class="a-name">${i.name}</div><div class="a-type">${i.type}</div></div>
      <div class="a-price">${i.price.toLocaleString('cs-CZ')} KK</div>
      <div class="a-stock">${i.stock ? i.stock + 'ks' : '∞'}</div>
      <div class="admin-actions">
        <button class="a-btn" data-edit="${i.id}">Upravit</button>
        <button class="a-btn danger" data-del="${i.id}">Smazat</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', async () => {
      const items = await API.getShopItems();
      startEdit(items.find(x => x.id === +b.dataset.edit));
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', async () => {
      await API.adminDeleteItem(+b.dataset.del);
      renderAdminList();
      renderShop();
    });
  });
}

function startEdit(item) {
  if (!item) return;
  editingId = item.id;
  document.getElementById('fName').value = item.name;
  document.getElementById('fType').value = item.type;
  document.getElementById('fPrice').value = item.price;
  document.getElementById('fImg').value = item.img || '';
  document.getElementById('fStock').value = item.stock || '';
  document.getElementById('fSubmit').textContent = 'Uložit změny';
  document.getElementById('fCancelEdit').style.display = 'block';
  document.querySelector('.admin-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  editingId = null;
  ['fName', 'fPrice', 'fImg', 'fStock'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fType').value = 'Losování';
  document.getElementById('fSubmit').textContent = 'Přidat výhru';
  document.getElementById('fCancelEdit').style.display = 'none';
}

function initAdminForm() {
  document.getElementById('fCancelEdit').addEventListener('click', resetForm);

  document.getElementById('fSubmit').addEventListener('click', async () => {
    const name = document.getElementById('fName').value.trim();
    const type = document.getElementById('fType').value;
    const price = parseInt(document.getElementById('fPrice').value) || 0;
    const img = document.getElementById('fImg').value.trim();
    const stockVal = document.getElementById('fStock').value;
    const stock = stockVal ? parseInt(stockVal) : null;
    if (!name || !price) return;

    const item = { name, type, price, img, stock };
    if (editingId) {
      await API.adminUpdateItem(editingId, item);
    } else {
      await API.adminCreateItem(item);
    }
    resetForm();
    renderAdminList();
    renderShop();
  });
}

function initAdminLogin() {
  const overlay = document.getElementById('adminModalOverlay');

  document.getElementById('adminLoginBtn').addEventListener('click', async () => {
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;
    const ok = await API.adminLogin(u, p);

    if (ok) {
      overlay.classList.remove('open');
      document.getElementById('adminError').classList.remove('show');
      document.getElementById('adminTab').style.display = 'inline-block';
      document.getElementById('adminTab').click();
      renderAdminList();
    } else {
      document.getElementById('adminError').classList.add('show');
    }
  });
}
