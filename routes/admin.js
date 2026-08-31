const express = require('express');
const multer = require('multer');
const router = express.Router();
const store = require('../data/store');

function requireAdmin(req, res, next) {
  if (!req.session.is_admin) return res.status(401).json({ error: 'Nejsi přihlášen jako admin' });
  next();
}

// Nahrávání obrázků - soubor jde přímo do paměti a ukládá se jako
// base64 do databáze (žádný souborový storage, žádný zásah do Railway).
// Omezeno na 3 MB a jen obrázkové typy.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Soubor musí být obrázek'));
    }
    cb(null, true);
  },
});

router.post('/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Nahrání se nezdařilo' });
    if (!req.file) return res.status(400).json({ error: 'Žádný soubor nebyl odeslán' });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ ok: true, url: dataUri });
  });
});

router.get('/me', (req, res) => {
  res.json({ is_admin: Boolean(req.session.is_admin) });
});

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

// Ruční úprava KK bodů konkrétnímu uživateli z administrace
// (přičtení i odečtení - záporná částka body odečte).
router.get('/users/search', requireAdmin, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ ok: true, users: [] });
    const users = await store.getLeaderboard(q);
    res.json({ ok: true, users: users.slice(0, 20) });
  } catch (err) { next(err); }
});

router.post('/points/adjust', requireAdmin, async (req, res, next) => {
  try {
    const { kick_user_id, amount, reason } = req.body;
    const amt = parseInt(amount, 10);
    if (!kick_user_id || !amt) {
      return res.status(400).json({ error: 'Chybí uživatel nebo neplatná částka' });
    }
    await store.addPoints(kick_user_id, amt, 'admin_adjust', reason ? { note: reason } : null);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/items', requireAdmin, async (req, res, next) => {
  try {
    const { name, type, price, img, stock, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Chybí název nebo cena' });
    const item = await store.createShopItem({ name, type, price: parseInt(price, 10), img, stock, description });
    res.json({ ok: true, item });
  } catch (err) { next(err); }
});

router.put('/items/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, type, price, img, stock, description } = req.body;
    const item = await store.updateShopItem(parseInt(req.params.id, 10), {
      name, type, price: price ? parseInt(price, 10) : undefined, img, stock, description,
    });
    if (!item) return res.status(404).json({ error: 'Položka nenalezena' });
    res.json({ ok: true, item });
  } catch (err) { next(err); }
});

router.delete('/items/:id', requireAdmin, async (req, res, next) => {
  try {
    await store.deleteShopItem(parseInt(req.params.id, 10));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Lístky pro kolo štěstí - jedno jméno na koupený kus daného losování.
router.get('/items/:id/tickets', requireAdmin, async (req, res, next) => {
  try {
    const tickets = await store.getItemTickets(parseInt(req.params.id, 10));
    res.json({ ok: true, tickets });
  } catch (err) { next(err); }
});

// Odebere vítězi jeden lístek na danou položku (aby nešel vylosovat znovu).
router.post('/items/:id/tickets/remove', requireAdmin, async (req, res, next) => {
  try {
    const { kick_user_id } = req.body;
    if (!kick_user_id) return res.status(400).json({ error: 'Chybí kick_user_id' });
    const removed = await store.removeOneTicket(parseInt(req.params.id, 10), kick_user_id);
    if (!removed) return res.status(404).json({ error: 'Lístek nenalezen' });
    const tickets = await store.getItemTickets(parseInt(req.params.id, 10));
    res.json({ ok: true, tickets });
  } catch (err) { next(err); }
});

module.exports = router;
