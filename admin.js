// admin.js — Admin login a CRUD nad výhrami
// Pozn.: ID prvků tady musí sedět s public/index.html (modal + sekce #view-admin).

let editingItemId = null;

// ---- Přihlášení do administrace ----
function initAdminLogin() {
  const loginBtn = document.getElementById('adminLoginBtn');
  if (!loginBtn) return;

  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleAdminLogin();
  });

  // Enter v poli hesla odešle formulář rovnou
  const passInput = document.getElementById('adminPass');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdminLogin();
      }
    });
  }
}

async function handleAdminLogin() {
  const userInput = document.getElementById('adminUser');
  const passInput = document.getElementById('adminPass');
  const errEl = document.getElementById('adminError');

  const username = userInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    if (errEl) { errEl.textContent = 'Vyplň jméno i heslo!'; errEl.style.display = 'block'; }
    return;
  }

  const res = await api.adminLogin(username, password);

  if (res && res.ok) {
    if (errEl) errEl.style.display = 'none';
    passInput.value = '';
    document.getElementById('adminModalOverlay')?.classList.remove('open');

    // Odemkni tab Administrace a rovnou do něj přepni
    const adminTab = document.getElementById('adminTab');
    if (adminTab) {
      adminTab.style.display = 'inline-block';
      adminTab.click();
    }
    renderAdminList();
  } else {
    if (errEl) {
      errEl.textContent = (res && res.error) || 'Špatné jméno nebo heslo.';
      errEl.style.display = 'block';
    }
  }
}

async function handleAdminLogout() {
  await api.adminLogout();
  const adminTab = document.getElementById('adminTab');
  if (adminTab) adminTab.style.display = 'none';
  refreshAllData();
}

// ---- Formulář pro přidání / úpravu výhry ----
function initAdminForm() {
  const submitBtn = document.getElementById('fSubmit');
  const cancelBtn = document.getElementById('fCancelEdit');

  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await submitAdminForm();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAdminForm();
    });
  }
}

async function submitAdminForm() {
  const name = document.getElementById('fName').value.trim();
  const type = document.getElementById('fType').value;
  const price = parseInt(document.getElementById('fPrice').value, 10);
  const stockRaw = document.getElementById('fStock').value.trim();
  const stock = stockRaw === '' ? null : parseInt(stockRaw, 10);
  const img = document.getElementById('fImg').value.trim() || null;

  if (!name || isNaN(price)) {
    alert('Vyplňte prosím název a platnou cenu.');
    return;
  }

  const itemData = { name, type, price, img, stock };

  let result;
  if (editingItemId) {
    result = await api.adminUpdateItem(editingItemId, itemData);
  } else {
    result = await api.adminAddItem(itemData);
  }

  if (result && result.ok) {
    resetAdminForm();
    refreshAllData();
  } else {
    alert('Chyba při ukládání výhry: ' + (result?.error || 'Ujistěte se, že jste přihlášeni jako admin.'));
  }
}

function resetAdminForm() {
  editingItemId = null;

  const fName = document.getElementById('fName');
  const fType = document.getElementById('fType');
  const fPrice = document.getElementById('fPrice');
  const fStock = document.getElementById('fStock');
  const fImg = document.getElementById('fImg');
  const fImgFile = document.getElementById('fImgFile');
  const fImgPreviewWrap = document.getElementById('fImgPreviewWrap');
  const submitBtn = document.getElementById('fSubmit');
  const cancelBtn = document.getElementById('fCancelEdit');

  if (fName) fName.value = '';
  if (fType) fType.selectedIndex = 0;
  if (fPrice) fPrice.value = '';
  if (fStock) fStock.value = '';
  if (fImg) fImg.value = '';
  if (fImgFile) fImgFile.value = '';
  if (fImgPreviewWrap) fImgPreviewWrap.style.display = 'none';
  if (submitBtn) submitBtn.textContent = 'Přidat výhru';
  if (cancelBtn) cancelBtn.style.display = 'none';
}

function startEditItem(item) {
  editingItemId = item.id;

  document.getElementById('fName').value = item.name || '';
  document.getElementById('fType').value = item.type || 'Losování';
  document.getElementById('fPrice').value = item.price || 0;
  document.getElementById('fStock').value = item.stock === null || item.stock === undefined ? '' : item.stock;
  document.getElementById('fImg').value = item.img || '';

  const previewWrap = document.getElementById('fImgPreviewWrap');
  const preview = document.getElementById('fImgPreview');
  if (item.img && preview && previewWrap) {
    preview.src = item.img;
    previewWrap.style.display = 'block';
  } else if (previewWrap) {
    previewWrap.style.display = 'none';
  }

  const submitBtn = document.getElementById('fSubmit');
  if (submitBtn) submitBtn.textContent = 'Uložit změny';
  const cancelBtn = document.getElementById('fCancelEdit');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';

  document.getElementById('view-admin')?.scrollIntoView({ behavior: 'smooth' });
}

async function deleteAdminItem(id) {
  if (!confirm('Opravdu chceš tuto výhru smazat?')) return;
  const res = await api.adminDeleteItem(id);
  if (res && res.ok) {
    refreshAllData();
  } else {
    alert('Chyba při mazání: ' + (res?.error || 'Neznámá chyba'));
  }
}

// ---- Nahrávání obrázku ----
function initImageUpload() {
  const fileInput = document.getElementById('fImgFile');
  if (!fileInput) return;

  fileInput.addEventListener('change', async () => {
    if (!fileInput.files.length) return;

    const uploadingEl = document.getElementById('fImgUploading');
    const previewWrap = document.getElementById('fImgPreviewWrap');
    const preview = document.getElementById('fImgPreview');

    if (uploadingEl) uploadingEl.style.display = 'block';

    const res = await api.adminUploadImage(fileInput.files[0]);

    if (uploadingEl) uploadingEl.style.display = 'none';

    if (res && res.url) {
      document.getElementById('fImg').value = res.url;
      if (preview && previewWrap) {
        preview.src = res.url;
        previewWrap.style.display = 'block';
      }
    } else {
      alert('Chyba při nahrávání obrázku: ' + (res?.error || 'Neznámá chyba'));
      fileInput.value = '';
    }
  });
}

// ---- Výpis výher v administraci ----
async function renderAdminList() {
  const list = document.getElementById('adminList');
  if (!list) return;

  const items = await api.getShopItems();
  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><strong>Zatím žádné výhry</strong>Přidej první výhru výše.</div>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div class="a-thumb">${thumbHtml(item.img)}</div>
      <div>
        <div class="a-name">${item.name}</div>
        <div class="a-type">${item.type || ''}</div>
      </div>
      <div class="a-price">${item.price.toLocaleString('cs-CZ')} KK</div>
      <div class="a-stock">${item.stock === null || item.stock === undefined ? 'neomezeno' : item.stock + ' ks'}</div>
      <div class="admin-actions">
        <button class="a-btn" data-edit="${item.id}">Upravit</button>
        <button class="a-btn danger" data-del="${item.id}">Smazat</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((i) => i.id === Number(btn.dataset.edit));
      if (item) startEditItem(item);
    });
  });
  list.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteAdminItem(Number(btn.dataset.del)));
  });
}

// ---- Znovunačtení všech dat po admin akci ----
function refreshAllData() {
  renderLeaderboard();
  renderYourStats();
  renderShop();
  renderInventory();
  renderAdminList();
}
