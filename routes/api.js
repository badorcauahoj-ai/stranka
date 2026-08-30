const express = require('express');
const router = express.Router();
const store = require('../data/store');

router.get('/leaderboard', async (req, res, next) => {
  try {
    const search = (req.query.q || '').toString();
    res.json({ leaderboard: await store.getLeaderboard(search) });
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.user_id) return res.json({ user: null });
    const user = await store.findUser(req.session.user_id);
    if (!user) return res.json({ user: null });
    res.json({ user: { ...user, rank: await store.getRank(user.kick_user_id) } });
  } catch (err) { next(err); }
});

router.get('/shop', async (req, res, next) => {
  try {
    res.json({ items: await store.getShopItems() });
  } catch (err) { next(err); }
});

router.get('/inventory', async (req, res, next) => {
  try {
    if (!req.session.user_id) return res.status(401).json({ error: 'Nejsi přihlášen' });
    res.json({ inventory: await store.getInventory(req.session.user_id) });
  } catch (err) { next(err); }
});

router.post('/shop/buy', async (req, res, next) => {
  try {
    if (!req.session.user_id) return res.status(401).json({ error: 'Nejsi přihlášen' });
    const { item_id, quantity } = req.body;
    const qty = Math.max(1, parseInt(quantity || 1, 10));
    const result = await store.buyItem(req.session.user_id, parseInt(item_id, 10), qty);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ ok: true, purchase: result.purchase });
  } catch (err) { next(err); }
});

module.exports = router;
