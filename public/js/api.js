// Centralizovaná komunikace s backendem.
// Až bude napojená databáze, mění se pouze tenhle soubor - zbytek frontendu
// pracuje s daty, která tyto funkce vrátí, a nezajímá ho odkud jsou.

const API = {
  async getLeaderboard(search = '') {
    const res = await fetch('/api/leaderboard?q=' + encodeURIComponent(search));
    if (!res.ok) return [];
    const data = await res.json();
    return data.leaderboard || [];
  },

  async getMe() {
    const res = await fetch('/api/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  },

  async getShopItems() {
    const res = await fetch('/api/shop');
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  },

  async buyItem(itemId, quantity = 1) {
    const res = await fetch('/api/shop/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  },

  async getInventory() {
    const res = await fetch('/api/inventory');
    if (!res.ok) return [];
    const data = await res.json();
    return data.inventory || [];
  },

  async adminLogin(username, password) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.ok;
  },

  async adminUploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  },

  async adminCreateItem(item) {
    const res = await fetch('/api/admin/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  },

  async adminUpdateItem(id, item) {
    const res = await fetch('/api/admin/items/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.ok;
  },

  async adminDeleteItem(id) {
    const res = await fetch('/api/admin/items/' + id, { method: 'DELETE' });
    return res.ok;
  },
};
