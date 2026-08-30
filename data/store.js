const { pool } = require('../db/pool');

async function findUser(kick_user_id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE kick_user_id = $1', [kick_user_id]);
  return rows[0] || null;
}

async function upsertUser({ kick_user_id, username, avatar_url, is_subscriber }) {
  const { rows } = await pool.query(
    `INSERT INTO users (kick_user_id, username, avatar_url, is_subscriber)
     VALUES ($1, $2, $3, COALESCE($4, FALSE))
     ON CONFLICT (kick_user_id) DO UPDATE SET
       username = EXCLUDED.username,
       avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
       is_subscriber = COALESCE($4, users.is_subscriber),
       updated_at = now()
     RETURNING *`,
    [kick_user_id, username, avatar_url || null, is_subscriber === undefined ? null : is_subscriber]
  );
  return rows[0];
}

async function addPoints(kick_user_id, amount, reason = 'manual_adjust', meta = null) {
  await pool.query(
    'UPDATE users SET kk_points = GREATEST(0, kk_points + $1), updated_at = now() WHERE kick_user_id = $2',
    [amount, kick_user_id]
  );
  await pool.query(
    'INSERT INTO point_transactions (kick_user_id, amount, reason, meta) VALUES ($1, $2, $3, $4)',
    [kick_user_id, amount, reason, meta ? JSON.stringify(meta) : null]
  );
}

async function getLeaderboard(search = '') {
  const { rows } = await pool.query(
    search
      ? `SELECT kick_user_id, username, avatar_url, is_subscriber, kk_points, sub_streak
         FROM users WHERE username ILIKE $1 ORDER BY kk_points DESC LIMIT 200`
      : `SELECT kick_user_id, username, avatar_url, is_subscriber, kk_points, sub_streak
         FROM users ORDER BY kk_points DESC LIMIT 200`,
    search ? [`%${search}%`] : []
  );
  return rows.map((u, idx) => ({ ...u, rank: idx + 1 }));
}

async function getRank(kick_user_id) {
  const { rows } = await pool.query(
    `SELECT rank FROM (
       SELECT kick_user_id, RANK() OVER (ORDER BY kk_points DESC) AS rank FROM users
     ) t WHERE kick_user_id = $1`,
    [kick_user_id]
  );
  return rows[0] ? Number(rows[0].rank) : null;
}

async function getShopItems() {
  const { rows } = await pool.query('SELECT * FROM shop_items WHERE active = TRUE ORDER BY price ASC');
  return rows;
}

async function createShopItem({ name, type, price, img, stock }) {
  const { rows } = await pool.query(
    `INSERT INTO shop_items (name, type, price, img, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, type || 'Losování', price, img || null, stock === undefined ? null : stock]
  );
  return rows[0];
}

async function updateShopItem(id, { name, type, price, img, stock }) {
  const { rows } = await pool.query(
    `UPDATE shop_items SET
       name = COALESCE($2, name),
       type = COALESCE($3, type),
       price = COALESCE($4, price),
       img = COALESCE($5, img),
       stock = COALESCE($6, stock)
     WHERE id = $1 RETURNING *`,
    [id, name, type, price, img, stock]
  );
  return rows[0] || null;
}

async function deleteShopItem(id) {
  await pool.query('DELETE FROM shop_items WHERE id = $1', [id]);
}

async function buyItem(kick_user_id, item_id, quantity) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      'SELECT * FROM users WHERE kick_user_id = $1 FOR UPDATE', [kick_user_id]
    );
    const { rows: itemRows } = await client.query(
      'SELECT * FROM shop_items WHERE id = $1 FOR UPDATE', [item_id]
    );
    const user = userRows[0];
    const item = itemRows[0];

    if (!user || !item) {
      await client.query('ROLLBACK');
      return { error: 'Uživatel nebo položka nenalezena' };
    }

    const total = item.price * quantity;
    if (user.kk_points < total) {
      await client.query('ROLLBACK');
      return { error: 'Nedostatek KK bodů' };
    }
    if (item.stock !== null && item.stock < quantity) {
      await client.query('ROLLBACK');
      return { error: 'Nedostatek skladem' };
    }

    await client.query('UPDATE users SET kk_points = kk_points - $1 WHERE kick_user_id = $2', [total, kick_user_id]);
    if (item.stock !== null) {
      await client.query('UPDATE shop_items SET stock = stock - $1 WHERE id = $2', [quantity, item_id]);
    }
    const { rows: purchaseRows } = await client.query(
      `INSERT INTO purchases (kick_user_id, item_id, quantity, name, img, type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [kick_user_id, item_id, quantity, item.name, item.img, item.type]
    );
    await client.query(
      'INSERT INTO point_transactions (kick_user_id, amount, reason, meta) VALUES ($1, $2, $3, $4)',
      [kick_user_id, -total, 'shop_purchase', JSON.stringify({ item_id, quantity })]
    );

    await client.query('COMMIT');
    return { purchase: purchaseRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getInventory(kick_user_id) {
  const { rows } = await pool.query(
    'SELECT * FROM purchases WHERE kick_user_id = $1 ORDER BY created_at DESC', [kick_user_id]
  );
  return rows;
}

async function hasChatIntervalPassed(kick_user_id, bucket) {
  try {
    await pool.query(
      'INSERT INTO chat_intervals (kick_user_id, interval_bucket) VALUES ($1, $2)',
      [kick_user_id, bucket]
    );
    return true; // nový interval, body se mají připsat
  } catch (err) {
    if (err.code === '23505') return false; // UNIQUE violation = už bylo připsáno
    throw err;
  }
}

module.exports = {
  findUser,
  upsertUser,
  addPoints,
  getLeaderboard,
  getRank,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  buyItem,
  getInventory,
  hasChatIntervalPassed,
};
