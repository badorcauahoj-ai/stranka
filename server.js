require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const { initSchema } = require('./db/pool');

const app = express();

// Nutné pro Railway / Heroku (HTTPS proxy) - bez toho nefungují cookies v produkci
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'dev-secret-zmen-v-produkci',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  secureProxy: true, // Zajišťuje funkčnost cookies na HTTPS
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/webhooks', require('./routes/webhook'));
app.use('/api', require('./routes/api'));

app.use(express.static(path.join(__dirname, 'public')));

// Jednotné zpracování chyb z async routes (viz `next(err)` v routes/*.js)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interní chyba serveru' });
});

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`tyblaho69 KK server běží na http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Nepodařilo se inicializovat databázi:', err);
    process.exit(1);
  });
