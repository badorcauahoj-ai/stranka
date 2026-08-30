const express = require('express');
const router = express.Router();
const store = require('../data/store');

function requireAdmin(req, res, next) {
  if (!req.session.is_admin) return res.status(401).json({ error: 'Nejsi přihlášen jako admin' });
  next();
}

// Heslo se čte z prostředí serveru, nikdy není vidět v kódu stránky.
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validPass) {
    console.warn('ADMIN_PASSWORD není nastaveno v .env - admin přihlášení je vypnuté.');
    return res.status(500).json({ error: 'Admin účet není nakonfigurován' });
  }

  if (username === validUser && password === validPass) {
    req.session.is_admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Špatné jméno nebo heslo' });
});

router.post('/logout', (req, res) => {
  req.session.is_admin = false;
  res.json({ ok: true });
});

router.post('/items', requireAdmin, (req, res) => {
  const { name, type, price, img, stock } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Chybí název nebo cena' });
  const item = store.createShopItem({ name, type, price: parseInt(price, 10), img, stock });
  res.json({ ok: true, item });
});

router.put('/items/:id', requireAdmin, (req, res) => {
  const { name, type, price, img, stock } = req.body;
  const item = store.updateShopItem(parseInt(req.params.id, 10), {
    name, type, price: price ? parseInt(price, 10) : undefined, img, stock,
  });
  if (!item) return res.status(404).json({ error: 'Položka nenalezena' });
  res.json({ ok: true, item });
});

router.delete('/items/:id', requireAdmin, (req, res) => {
  store.deleteShopItem(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

module.exports = router;
