// admin.js — Admin login a CRUD nad výhrami

let editingItemId = null;

function initAdmin() {
  const form = document.getElementById('admin-item-form');
  const fileInput = document.getElementById('admin-img-file');
  const fileBtn = document.getElementById('admin-file-btn');
  const fileNotice = document.getElementById('admin-file-notice');

  if (fileBtn && fileInput) {
    fileBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      if (fileInput.files.length > 0) {
        fileNotice.textContent = 'Vybrán: ' + fileInput.files[0].name;
      } else {
        fileNotice.textContent = '';
      }
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('admin-name').value.trim();
      const price = parseInt(document.getElementById('admin-price').value, 10);
      const category = document.getElementById('admin-cat').value;
      const desc = document.getElementById('admin-desc').value.trim();
      const icon = document.getElementById('admin-icon').value.trim() || '🎁';
      let img = document.getElementById('admin-img-url').value.trim();

      if (!name || isNaN(price)) {
        alert('Vyplňte prosím název a platnou cenu.');
        return;
      }

      // Pokud uživatel vybral soubor, nahrajeme ho na server
      if (fileInput && fileInput.files.length > 0) {
        fileNotice.textContent = 'Nahrávám obrázek...';
        const uploadRes = await api.adminUploadImage(fileInput.files[0]);
        if (uploadRes && uploadRes.url) {
          img = uploadRes.url;
        } else {
          alert('Chyba při nahrávání obrázku: ' + (uploadRes?.error || 'Neznámá chyba'));
          fileNotice.textContent = '';
          return;
        }
      }

      const itemData = { name, price, category, desc, icon, img };

      let result;
      if (editingItemId) {
        result = await api.adminUpdateItem(editingItemId, itemData);
      } else {
        result = await api.adminAddItem(itemData);
      }

      if (result && result.success) {
        resetAdminForm();
        refreshAllData();
      } else {
        alert('Chyba při ukládání výhry: ' + (result?.error || 'Ujistěte se, že jste přihlášeni jako admin.'));
      }
    };
  }
}

async function handleAdminLogin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
  const errEl = document.getElementById('admin-login-err');

  if (!user || !pass) {
    if (errEl) errEl.textContent = 'Vyplň jméno i heslo!';
    return;
  }

  const res = await api.adminLogin(user, pass);
  if (res && res.success) {
    if (errEl) errEl.textContent = '';
    closeAdminModal();
    refreshAllData();
  } else {
    if (errEl) errEl.textContent = res?.error || 'Špatné jméno nebo heslo!';
  }
}

async function handleAdminLogout() {
  await api.adminLogout();
  refreshAllData();
}

function startEditItem(item) {
  editingItemId = item.id;
  document.getElementById('admin-form-title').textContent = 'Upravit výhru';
  document.getElementById('admin-name').value = item.name || '';
  document.getElementById('admin-price').value = item.price || 0;
  document.getElementById('admin-cat').value = item.category || 'Hry / Klíče';
  document.getElementById('admin-desc').value = item.desc || '';
  document.getElementById('admin-icon').value = item.icon || '';
  document.getElementById('admin-img-url').value = item.img || '';

  const cancelBtn = document.getElementById('admin-cancel-edit');
  if (cancelBtn) cancelBtn.style.display = 'inline-block';

  // Scroll nahoru k formuláři
  document.getElementById('admin-item-form')?.scrollIntoView({ behavior: 'smooth' });
}

function resetAdminForm() {
  editingItemId = null;
  const form = document.getElementById('admin-item-form');
  if (form) form.reset();

  const title = document.getElementById('admin-form-title');
  if (title) title.textContent = 'Přidat novou výhru';

  const cancelBtn = document.getElementById('admin-cancel-edit');
  if (cancelBtn) cancelBtn.style.display = 'none';

  const fileNotice = document.getElementById('admin-file-notice');
  if (fileNotice) fileNotice.textContent = '';
}

async function deleteAdminItem(id) {
  if (confirm('Opravdu chceš tuto výhru smazat?')) {
    const res = await api.adminDeleteItem(id);
    if (res && res.success) {
      refreshAllData();
    } else {
      alert('Chyba při mazání: ' + (res?.error || 'Neznámá chyba'));
    }
  }
}
