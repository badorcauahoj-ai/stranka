// Dočasné úložiště v paměti procesu.
// Až budeš mít databázi (Postgres na Railway apod.), nahraď funkce v tomto
// souboru dotazy do DB - zbytek serveru (routes/*.js) se nemusí měnit,
// protože pracuje jen s touhle vrstvou.

let users = [];        // { kick_user_id, username, avatar_url, is_subscriber, kk_points, sub_streak }
let shopItems = [];     // { id, name, type, price, img, stock }
let purchases = [];     // { id, kick_user_id, item_id, quantity, created_at }
let nextItemId = 1;
let nextPurchaseId = 1;

function findUser(kick_user_id) {
  return users.find(u => u.kick_user_id === kick_user_id) || null;
}

function upsertUser({ kick_user_id, username, avatar_url, is_subscriber }) {
  let user = findUser(kick_user_id);
  if (!user) {
    user = { kick_user_id, username, avatar_url, is_subscriber: !!is_subscriber, kk_points: 0, sub_streak: 0 };
    users.push(user);
  } else {
    user.username = username || user.username;
    if (avatar_url) user.avatar_url = avatar_url;
    if (is_subscriber !== undefined) user.is_subscriber = is_subscriber;
  }
  return user;
}

function addPoints(kick_user_id, amount) {
  const user = findUser(kick_user_id);
  if (!user) return;
  user.kk_points = Math.max(0, user.kk_points + amount);
}

function getLeaderboard(search = '') {
  const sorted = [...users].sort((a, b) => b.kk_points - a.kk_points);
  const filtered = search
    ? sorted.filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
    : sorted;
  return filtered.map((u, idx) => ({ ...u, rank: sorted.indexOf(u) + 1 }));
}

function getRank(kick_user_id) {
  const sorted = [...users].sort((a, b) => b.kk_points - a.kk_points);
  const idx = sorted.findIndex(u => u.kick_user_id === kick_user_id);
  return idx === -1 ? null : idx + 1;
}

function getShopItems() {
  return shopItems.filter(i => i.active !== false);
}

function createShopItem(item) {
  const newItem = { id: nextItemId++, active: true, ...item };
  shopItems.push(newItem);
  return newItem;
}

function updateShopItem(id, patch) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}

function deleteShopItem(id) {
  shopItems = shopItems.filter(i => i.id !== id);
}

function buyItem(kick_user_id, item_id, quantity) {
  const user = findUser(kick_user_id);
  const item = shopItems.find(i => i.id === item_id);
  if (!user || !item) return { error: 'Uživatel nebo položka nenalezena' };

  const total = item.price * quantity;
  if (user.kk_points < total) return { error: 'Nedostatek KK bodů' };
  if (item.stock !== null && item.stock !== undefined && item.stock < quantity) {
    return { error: 'Nedostatek skladem' };
  }

  user.kk_points -= total;
  if (item.stock !== null && item.stock !== undefined) item.stock -= quantity;

  const purchase = {
    id: nextPurchaseId++,
    kick_user_id,
    item_id,
    quantity,
    name: item.name,
    img: item.img,
    type: item.type,
    created_at: new Date().toISOString(),
  };
  purchases.push(purchase);
  return { purchase };
}

function getInventory(kick_user_id) {
  return purchases.filter(p => p.kick_user_id === kick_user_id);
}

module.exports = {
  upsertUser,
  findUser,
  addPoints,
  getLeaderboard,
  getRank,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  buyItem,
  getInventory,
};
