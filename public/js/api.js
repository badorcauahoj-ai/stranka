// api.js — Veškerá komunikace s backendem (API client)

const api = {
  // ---- Náhled / Inicializace ----
  async getInitialData() {
    try {
      const res = await fetch('/api/init');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Chyba při načítání dat:', e);
      return null;
    }
  },

  // ---- Nákup výhry ----
  async buyItem(itemId) {
    try {
      const res = await fetch('/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při nákupu:', e);
      return { success: false, error: 'Chyba sítě' };
    }
  },

  // ---- Admin Login / Logout ----
  async adminLogin(username, password) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při přihlašování admina:', e);
      return { success: false, error: 'Chyba sítě' };
    }
  },

  async adminLogout() {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error('Chyba při odhlašování:', e);
      return { success: false };
    }
  },

  // ---- Admin CRUD nad výhrami ----
  async adminAddItem(itemData) {
    try {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při přidávání výhry:', e);
      return { success: false, error: 'Chyba sítě' };
    }
  },

  async adminUpdateItem(id, itemData) {
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při úpravě výhry:', e);
      return { success: false, error: 'Chyba sítě' };
    }
  },

  async adminDeleteItem(id) {
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při mazání výhry:', e);
      return { success: false, error: 'Chyba sítě' };
    }
  },

  // ---- Admin Nahrání obrázku ----
  async adminUploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při nahrávání souboru:', e);
      return { error: 'Chyba sítě při nahrávání souboru' };
    }
  },
};
window.API = api;
