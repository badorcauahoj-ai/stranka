// api.js — Veškerá komunikace s backendem (API client)

const api = {
  // ---- Leaderboard ----
  async getLeaderboard(search = '') {
    try {
      const url = search ? `/api/leaderboard?q=${encodeURIComponent(search)}` : '/api/leaderboard';
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.leaderboard || [];
    } catch (e) {
      console.error('Chyba při načítání žebříčku:', e);
      return [];
    }
  },

  // ---- Přihlášený uživatel (přes Kick) ----
  async getMe() {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (e) {
      console.error('Chyba při načítání profilu:', e);
      return null;
    }
  },

  // ---- Shop ----
  async getShopItems() {
    try {
      const res = await fetch('/api/shop');
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      console.error('Chyba při načítání shopu:', e);
      return [];
    }
  },

  // ---- Inventář ----
  async getInventory() {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) return [];
      const data = await res.json();
      return data.inventory || [];
    } catch (e) {
      console.error('Chyba při načítání inventáře:', e);
      return [];
    }
  },

  // ---- Nákup výhry ----
  async buyItem(itemId, quantity = 1) {
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity }),
      });
      return await res.json();
    } catch (e) {
      console.error('Chyba při nákupu:', e);
      return { ok: false, error: 'Chyba sítě' };
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
      return { ok: false, error: 'Chyba sítě' };
    }
  },

  async adminLogout() {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error('Chyba při odhlašování:', e);
      return { ok: false };
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
      return { ok: false, error: 'Chyba sítě' };
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
      return { ok: false, error: 'Chyba sítě' };
    }
  },

  async adminDeleteItem(id) {
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.error('Chyba při mazání výhry:', e);
      return { ok: false, error: 'Chyba sítě' };
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
