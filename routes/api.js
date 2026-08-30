const express = require('express');
const router = express.Router();
const store = require('../data/store');

router.get('/leaderboard', (req, res) => {
  const search = (req.query.q || '').toString();
  res.json({ leaderboard: store.getLeaderboard(search) });
});

router.get('/me', (req, res) => {
  if (!req.session.user_id) return res.json({ user: null });
  const user = store.findUser(req.session.user_id);
  if (!user) return res.json({ user: null });
  res.json({ user: { ...user, rank: store.getRank(user.kick_user_id) } });
});

router.get('/shop', (req, res) => {
  res.json({ items: store.getShopItems() });
});

router.get('/inventory', (req, res) => {
  if (!req.session.user_id) return res.status(401).json({ error: 'Nejsi přihlášen' });
  res.json({ inventory: store.getInventory(req.session.user_id) });
});

router.post('/shop/buy', (req, res) => {
  if (!req.session.user_id) return res.status(401).json({ error: 'Nejsi přihlášen' });
  const { item_id, quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity || 1, 10));
  const result = store.buyItem(req.session.user_id, parseInt(item_id, 10), qty);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ ok: true, purchase: result.purchase });
});

module.exports = router;
